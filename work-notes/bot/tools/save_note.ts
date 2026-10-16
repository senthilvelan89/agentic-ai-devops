import { defineTool } from "@cursor/bdk/tools";
import { z } from "zod/v3";
import { saveNote, slug } from "../lib/knowledge.js";

export default defineTool({
  description:
    "Store one raw work note in the knowledge source before extracting facts from it.",
  effect: "write",
  inputSchema: z.object({
    text: z.string().min(1).max(20000),
    title: z.string().min(1).max(140).optional(),
    topic: z.string().min(1).max(80).optional(),
  }),
  dryRunResult: ({ text, title, topic }) => ({
    stored: false,
    dryRun: true,
    title: title ?? text.trim().slice(0, 80),
    topic: slug(topic ?? title ?? "untitled"),
  }),
  async execute({ text, title, topic }, ctx) {
    const capturedAt = new Date().toISOString();
    const resolvedTitle = (title ?? text.trim().split(/\r?\n/).find(Boolean) ?? "Work note")
      .trim()
      .slice(0, 140);
    const note = await saveNote(ctx.host.files, {
      title: resolvedTitle,
      topic: topic ?? resolvedTitle,
      text,
      capturedAt,
    });
    return {
      stored: true,
      id: note.id,
      title: note.title,
      topic: note.topic,
      capturedAt: note.capturedAt,
    };
  },
});
