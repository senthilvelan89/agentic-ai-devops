import { defineEval, includes } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke", "missing"],
  description: "An unknown topic is not filled in from the sample notes.",
  async test(t) {
    await t.send("Who did I last talk to about the warehouse freezer alarm?");
    t.succeeded();
    t.calledTool("search_knowledge");
    t.notCalledTool("save_note");
    t.notCalledTool("save_card");
    t.check(t.reply, includes(/Not in your notes/));
  },
});
