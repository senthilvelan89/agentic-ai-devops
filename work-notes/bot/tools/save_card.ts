import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod/v3";
import { CARD_KINDS, saveCard } from "../lib/knowledge.js";

export default defineTool({
  description:
    "Store one extracted fact from a work note: a resolution, contact, doc, URL, cheat, or known issue. Call once per fact.",
  effect: "write",
  inputSchema: z.object({
    kind: z.enum(CARD_KINDS),
    topic: z.string().min(1).max(80),
    title: z.string().min(1).max(140),
    body: z.string().min(1).max(4000),
    contactName: z.string().min(1).max(120).optional(),
    contactChannel: z.string().min(1).max(200).optional(),
    url: z.string().url().optional(),
    steps: z.array(z.string().min(1).max(300)).max(12).optional(),
    noteId: z.string().min(1).max(120).optional(),
  }),
  dryRunResult: ({ kind, topic, title }) => ({
    stored: false,
    dryRun: true,
    kind,
    topic,
    title,
  }),
  async execute(input, ctx) {
    const { card, updated } = await saveCard(ctx.host.files, {
      ...input,
      updatedAt: new Date().toISOString(),
    });
    return {
      stored: true,
      updated,
      id: card.id,
      kind: card.kind,
      topic: card.topic,
      title: card.title,
    };
  },
});
