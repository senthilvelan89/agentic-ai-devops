import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod/v3";
import { CARD_KINDS, searchKnowledge } from "../lib/knowledge.js";

export default defineTool({
  description:
    "Search the work-notes knowledge source. Use this before answering about a past fix, contact, doc, URL, cheat sheet, or known issue.",
  effect: "read",
  inputSchema: z.object({
    query: z.string().max(300).optional(),
    kind: z.enum(CARD_KINDS).optional(),
    topic: z.string().min(1).max(80).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  }),
  async execute({ query, kind, topic, limit }, ctx) {
    const result = await searchKnowledge(ctx.host.files, {
      query,
      kind,
      topic,
      limit: limit ?? 8,
    });
    return {
      query: result.query,
      notes: result.notes.map((note) => ({
        id: note.id,
        title: note.title,
        topic: note.topic,
        sample: note.sample,
        source: note.source,
        capturedAt: note.capturedAt,
        excerpt: note.text.slice(0, 700),
      })),
      cards: result.cards.map((card) => ({
        id: card.id,
        kind: card.kind,
        topic: card.topic,
        title: card.title,
        body: card.body,
        contactName: card.contactName,
        contactChannel: card.contactChannel,
        url: card.url,
        steps: card.steps,
        noteId: card.noteId,
        sample: card.sample,
        source: card.source,
        updatedAt: card.updatedAt,
      })),
    };
  },
});
