import { defineTool } from "@cursor/bdk/tools";
import { parseSaveNote, saveNoteSchema } from "../lib/input.js";
import { saveNote, slug } from "../lib/knowledge.js";

export default defineTool({
  description:
    "Store one raw work note in the knowledge source before extracting facts from it.",
  effect: "write",
  inputSchema: saveNoteSchema,
  dryRunResult: (input) => {
    const text = typeof input.text === "string" ? input.text : "";
    const title = typeof input.title === "string" ? input.title : text.trim().slice(0, 80);
    const topic = typeof input.topic === "string" ? input.topic : title;
    return {
      stored: false,
      dryRun: true,
      title,
      topic: slug(topic || "untitled"),
    };
  },
  async execute(input, ctx) {
    const { text, title, topic } = parseSaveNote(input);
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
