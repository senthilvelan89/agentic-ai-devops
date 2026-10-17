import { CARD_KINDS, type CardKind } from "./knowledge.js";

export const saveNoteSchema = {
  type: "object",
  additionalProperties: false,
  required: ["text"],
  properties: {
    text: { type: "string", minLength: 1, maxLength: 20000 },
    title: { type: "string", minLength: 1, maxLength: 140 },
    topic: { type: "string", minLength: 1, maxLength: 80 },
  },
};

export const saveCardSchema = {
  type: "object",
  additionalProperties: false,
  required: ["kind", "topic", "title", "body"],
  properties: {
    kind: { type: "string", enum: [...CARD_KINDS] },
    topic: { type: "string", minLength: 1, maxLength: 80 },
    title: { type: "string", minLength: 1, maxLength: 140 },
    body: { type: "string", minLength: 1, maxLength: 4000 },
    contactName: { type: "string", minLength: 1, maxLength: 120 },
    contactChannel: { type: "string", minLength: 1, maxLength: 200 },
    url: { type: "string", format: "uri" },
    steps: {
      type: "array",
      maxItems: 12,
      items: { type: "string", minLength: 1, maxLength: 300 },
    },
    noteId: { type: "string", minLength: 1, maxLength: 120 },
  },
};

export const searchKnowledgeSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    query: { type: "string", maxLength: 300 },
    kind: { type: "string", enum: [...CARD_KINDS] },
    topic: { type: "string", minLength: 1, maxLength: 80 },
    limit: { type: "integer", minimum: 1, maximum: 20 },
  },
};

export type SaveNoteInput = {
  text: string;
  title?: string;
  topic?: string;
};

export type SaveCardInput = {
  kind: CardKind;
  topic: string;
  title: string;
  body: string;
  contactName?: string;
  contactChannel?: string;
  url?: string;
  steps?: string[];
  noteId?: string;
};

export type SearchKnowledgeInput = {
  query?: string;
  kind?: CardKind;
  topic?: string;
  limit?: number;
};

export function parseSaveNote(input: unknown): SaveNoteInput {
  const record = objectInput(input, ["text", "title", "topic"]);
  return {
    text: requireString(record.text, "text", 1, 20000),
    title: optionalString(record.title, "title", 1, 140),
    topic: optionalString(record.topic, "topic", 1, 80),
  };
}

export function parseSaveCard(input: unknown): SaveCardInput {
  const record = objectInput(input, [
    "kind",
    "topic",
    "title",
    "body",
    "contactName",
    "contactChannel",
    "url",
    "steps",
    "noteId",
  ]);
  const kind = requireString(record.kind, "kind", 1, 40);
  if (!isCardKind(kind)) {
    throw new Error(`kind must be one of ${CARD_KINDS.join(", ")}`);
  }
  const parsed: SaveCardInput = {
    kind,
    topic: requireString(record.topic, "topic", 1, 80),
    title: requireString(record.title, "title", 1, 140),
    body: requireString(record.body, "body", 1, 4000),
    contactName: optionalString(record.contactName, "contactName", 1, 120),
    contactChannel: optionalString(record.contactChannel, "contactChannel", 1, 200),
    url: optionalUrl(record.url),
    steps: optionalSteps(record.steps),
    noteId: optionalString(record.noteId, "noteId", 1, 120),
  };
  return parsed;
}

export function parseSearch(input: unknown): SearchKnowledgeInput {
  const record = objectInput(input, ["query", "kind", "topic", "limit"]);
  const kind = optionalString(record.kind, "kind", 1, 40);
  if (kind !== undefined && !isCardKind(kind)) {
    throw new Error(`kind must be one of ${CARD_KINDS.join(", ")}`);
  }
  return {
    query: optionalString(record.query, "query", 0, 300),
    kind,
    topic: optionalString(record.topic, "topic", 1, 80),
    limit: optionalLimit(record.limit),
  };
}

function isCardKind(value: string): value is CardKind {
  return (CARD_KINDS as readonly string[]).includes(value);
}

function objectInput(input: unknown, allowed: string[]): Record<string, unknown> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Tool input must be an object");
  }
  const record = input as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) throw new Error(`Unexpected field ${key}`);
  }
  return record;
}

function requireString(value: unknown, name: string, min: number, max: number): string {
  const parsed = readString(value, name, min, max);
  if (parsed === undefined) throw new Error(`${name} is required`);
  return parsed;
}

function optionalString(
  value: unknown,
  name: string,
  min: number,
  max: number,
): string | undefined {
  if (value === undefined) return undefined;
  return readString(value, name, min, max);
}

function readString(
  value: unknown,
  name: string,
  min: number,
  max: number,
): string | undefined {
  if (typeof value !== "string") throw new Error(`${name} must be a string`);
  if (value.length < min || value.length > max) {
    throw new Error(`${name} must be ${min}-${max} characters`);
  }
  return value;
}

function optionalUrl(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const url = requireString(value, "url", 1, 2000);
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
  } catch {
    throw new Error("url must be an http(s) URL");
  }
  return url;
}

function optionalSteps(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 12) {
    throw new Error("steps must be an array of at most 12 strings");
  }
  return value.map((step, index) => requireString(step, `steps[${index}]`, 1, 300));
}

function optionalLimit(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 20) {
    throw new Error("limit must be an integer from 1 to 20");
  }
  return value;
}
