import { defineEval, includes } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke", "guide"],
  description: "The sample VPN note comes back as a labeled field guide.",
  async test(t) {
    await t.send(
      "Give me the field guide for the sample VPN timeout after laptop sleep. Use the knowledge source.",
    );
    t.succeeded();
    t.calledTool("search_knowledge");
    t.check(t.reply, includes(/Priya Shah/));
    t.check(t.reply, includes(/Sample starter note/));
  },
});
