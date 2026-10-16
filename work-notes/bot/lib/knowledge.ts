import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const CARD_KINDS = [
  "resolution",
  "contact",
  "doc",
  "url",
  "cheat",
  "known_issue",
] as const;

export type CardKind = (typeof CARD_KINDS)[number];
export type KnowledgeSource = "corpus" | "live";

export type KnowledgeNote = {
  id: string;
  title: string;
  topic: string;
  text: string;
  sample: boolean;
  source: KnowledgeSource;
  capturedAt: string;
};

export type KnowledgeCard = {
  id: string;
  kind: CardKind;
  topic: string;
  title: string;
  body: string;
  contactName?: string;
  contactChannel?: string;
  url?: string;
  steps?: string[];
  noteId?: string;
  sample: boolean;
  source: KnowledgeSource;
  updatedAt: string;
};

type KnowledgeFiles = {
  read(
    path: string,
    options: { scope: "deployment" },
  ): Promise<string | undefined>;
  write(
    path: string,
    data: string,
    options: { scope: "deployment" },
  ): Promise<void>;
  list(
    prefix: string,
    options: { scope: "deployment" },
  ): Promise<{ path: string }[]>;
};

const DEPLOYMENT = { scope: "deployment" as const };
const NOTES_PREFIX = "knowledge/notes/";
const CARDS_PREFIX = "knowledge/cards/";

const corpusDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../knowledge/notes",
);

export function slug(value: string): string {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned.slice(0, 60) || "untitled";
}

export function cardId(kind: CardKind, topic: string, title: string): string {
  return `card-${kind}-${slug(topic)}-${slug(title)}`.slice(0, 120);
}

export function newNoteId(): string {
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function isCardKind(value: string): value is CardKind {
  return (CARD_KINDS as readonly string[]).includes(value);
}

export async function saveNote(
  files: KnowledgeFiles,
  input: { title: string; topic: string; text: string; capturedAt: string },
): Promise<KnowledgeNote> {
  const note: KnowledgeNote = {
    id: newNoteId(),
    title: input.title.trim(),
    topic: slug(input.topic),
    text: input.text.trim(),
    sample: false,
    source: "live",
    capturedAt: input.capturedAt,
  };
  await files.write(
    `${NOTES_PREFIX}${note.id}.json`,
    JSON.stringify(note),
    DEPLOYMENT,
  );
  return note;
}

export async function saveCard(
  files: KnowledgeFiles,
  input: {
    kind: CardKind;
    topic: string;
    title: string;
    body: string;
    contactName?: string;
    contactChannel?: string;
    url?: string;
    steps?: string[];
    noteId?: string;
    updatedAt: string;
  },
): Promise<{ card: KnowledgeCard; updated: boolean }> {
  const topic = slug(input.topic);
  const id = cardId(input.kind, topic, input.title);
  const existing = await readJson<KnowledgeCard>(files, `${CARDS_PREFIX}${id}.json`);
  const card: KnowledgeCard = {
    id,
    kind: input.kind,
    topic,
    title: input.title.trim(),
    body: input.body.trim(),
    sample: false,
    source: "live",
    updatedAt: input.updatedAt,
  };
  if (input.contactName) card.contactName = input.contactName.trim();
  if (input.contactChannel) card.contactChannel = input.contactChannel.trim();
  if (input.url) card.url = input.url.trim();
  if (input.steps && input.steps.length > 0) {
    card.steps = input.steps.map((step) => step.trim()).filter(Boolean).slice(0, 12);
  }
  if (input.noteId) card.noteId = input.noteId;
  await files.write(`${CARDS_PREFIX}${id}.json`, JSON.stringify(card), DEPLOYMENT);
  return { card, updated: existing !== undefined };
}

export async function searchKnowledge(
  files: KnowledgeFiles,
  input: { query?: string; kind?: CardKind; topic?: string; limit: number },
): Promise<{
  query: string;
  notes: KnowledgeNote[];
  cards: KnowledgeCard[];
}> {
  const stored = await loadAll(files);
  const query = (input.query ?? "").trim();
  const topic = input.topic ? slug(input.topic) : undefined;
  const notes = rank(
    stored.notes.filter((note) => !topic || note.topic === topic),
    query,
    input.limit,
    (note) => [note.title, note.topic, note.text],
  );
  const cards = rank(
    stored.cards.filter((card) => {
      if (topic && card.topic !== topic) return false;
      if (input.kind && card.kind !== input.kind) return false;
      return true;
    }),
    query,
    input.limit,
    (card) => [
      card.title,
      card.topic,
      card.kind,
      card.body,
      card.contactName ?? "",
      card.contactChannel ?? "",
      card.url ?? "",
      ...(card.steps ?? []),
    ],
  );
  return { query, notes, cards };
}

async function loadAll(files: KnowledgeFiles): Promise<{
  notes: KnowledgeNote[];
  cards: KnowledgeCard[];
}> {
  const corpus = await loadCorpus();
  const liveNotes = await listJson<KnowledgeNote>(files, NOTES_PREFIX);
  const liveCards = await listJson<KnowledgeCard>(files, CARDS_PREFIX);
  return {
    notes: mergeById(corpus.notes, liveNotes.filter(isNote)),
    cards: mergeById(corpus.cards, liveCards.filter(isCard)),
  };
}

function mergeById<T extends { id: string }>(corpus: T[], live: T[]): T[] {
  const byId = new Map<string, T>();
  for (const item of corpus) byId.set(item.id, item);
  for (const item of live) byId.set(item.id, item);
  return [...byId.values()];
}

async function loadCorpus(): Promise<{
  notes: KnowledgeNote[];
  cards: KnowledgeCard[];
}> {
  let names: string[] = [];
  try {
    names = (await readdir(corpusDir)).filter((name) => name.endsWith(".md"));
  } catch {
    return { notes: [], cards: [] };
  }
  const notes: KnowledgeNote[] = [];
  const cards: KnowledgeCard[] = [];
  for (const name of names.sort()) {
    const markdown = await readFile(path.join(corpusDir, name), "utf8");
    const parsed = parseNoteMarkdown(name, markdown);
    notes.push(parsed.note);
    cards.push(...parsed.cards);
  }
  return { notes, cards };
}

export function parseNoteMarkdown(
  filename: string,
  markdown: string,
): { note: KnowledgeNote; cards: KnowledgeCard[] } {
  const frontmatter = readFrontmatter(markdown);
  const body = stripFrontmatter(markdown);
  const id = frontmatter.id || slug(filename.replace(/\.md$/, ""));
  const title = frontmatter.title || titleFromBody(body) || id;
  const topic = slug(frontmatter.topic || id);
  const sample = frontmatter.sample === "true";
  const capturedAt = frontmatter.captured || "1970-01-01T00:00:00.000Z";
  const note: KnowledgeNote = {
    id,
    title,
    topic,
    text: stripCardsFence(body).trim(),
    sample,
    source: "corpus",
    capturedAt,
  };
  const cards = readCardsFence(body).flatMap((raw) => {
    if (!isRecord(raw)) return [];
    const kind = asString(raw.kind);
    const cardTitle = asString(raw.title);
    const cardBody = asString(raw.body);
    if (!kind || !isCardKind(kind) || !cardTitle || !cardBody) return [];
    const card: KnowledgeCard = {
      id: cardId(kind, topic, cardTitle),
      kind,
      topic,
      title: cardTitle,
      body: cardBody,
      sample,
      source: "corpus",
      updatedAt: capturedAt,
      noteId: id,
    };
    const contactName = asString(raw.contactName);
    const contactChannel = asString(raw.contactChannel);
    const url = asString(raw.url);
    const steps = asStringList(raw.steps);
    if (contactName) card.contactName = contactName;
    if (contactChannel) card.contactChannel = contactChannel;
    if (url) card.url = url;
    if (steps) card.steps = steps;
    return [card];
  });
  return { note, cards };
}

function rank<T>(
  items: T[],
  query: string,
  limit: number,
  fields: (item: T) => string[],
): T[] {
  const needles = tokens(query);
  const scored = items.map((item) => ({
    item,
    score: scoreText(fields(item).join(" "), needles),
  }));
  return scored
    .filter((entry) => needles.length === 0 || entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

function scoreText(haystack: string, needles: string[]): number {
  if (needles.length === 0) return 1;
  const words = new Set(tokens(haystack));
  const lower = haystack.toLowerCase();
  let score = 0;
  for (const needle of needles) {
    if (words.has(needle)) score += 3;
    else if (lower.includes(needle)) score += 1;
  }
  return score;
}

function tokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function readFrontmatter(markdown: string): Record<string, string> {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return {};
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const split = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (split?.[1]) fields[split[1]] = (split[2] ?? "").trim();
  }
  return fields;
}

function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
}

function stripCardsFence(body: string): string {
  return body.replace(/```json cards\s*[\s\S]*?```/g, "");
}

function readCardsFence(body: string): unknown[] {
  const match = body.match(/```json cards\s*([\s\S]*?)```/);
  if (!match?.[1]) return [];
  try {
    const parsed = JSON.parse(match[1]) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function titleFromBody(body: string): string | undefined {
  const line = stripCardsFence(body)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .find((item) => item.length > 0 && !item.startsWith("#"));
  return line?.slice(0, 80);
}

async function listJson<T>(files: KnowledgeFiles, prefix: string): Promise<T[]> {
  let entries: { path: string }[] = [];
  try {
    entries = await files.list(prefix, DEPLOYMENT);
  } catch {
    return [];
  }
  const items: T[] = [];
  for (const entry of entries) {
    if (!entry.path.endsWith(".json")) continue;
    const parsed = await readJson<T>(files, entry.path);
    if (parsed !== undefined) items.push(parsed);
  }
  return items;
}

async function readJson<T>(
  files: KnowledgeFiles,
  filePath: string,
): Promise<T | undefined> {
  const raw = await files.read(filePath, DEPLOYMENT);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  return items.length > 0 ? items.slice(0, 12) : undefined;
}

function isNote(value: KnowledgeNote): boolean {
  return (
    typeof value?.id === "string" &&
    typeof value.title === "string" &&
    typeof value.topic === "string" &&
    typeof value.text === "string"
  );
}

function isCard(value: KnowledgeCard): boolean {
  return (
    typeof value?.id === "string" &&
    typeof value.kind === "string" &&
    isCardKind(value.kind) &&
    typeof value.title === "string" &&
    typeof value.body === "string"
  );
}
