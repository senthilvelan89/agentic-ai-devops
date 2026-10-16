import { defineTool } from "@cursor/bdk/tools";
import { parseSaveCard, saveCardSchema } from "../lib/input.js";
import { saveCard } from "../lib/knowledge.js";

export default defineTool({
  description:
    "Store one extracted fact from a work note: a resolution, contact, doc, URL, cheat, or known issue. Call once per fact.",
  effect: "write",
  inputSchema: saveCardSchema,
  dryRunResult: (input) => ({
    stored: false,
    dryRun: true,
    kind: typeof input.kind === "string" ? input.kind : "",
    topic: typeof input.topic === "string" ? input.topic : "",
    title: typeof input.title === "string" ? input.title : "",
  }),
  async execute(input, ctx) {
    const parsed = parseSaveCard(input);
    const { card, updated } = await saveCard(ctx.host.files, {
      ...parsed,
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
