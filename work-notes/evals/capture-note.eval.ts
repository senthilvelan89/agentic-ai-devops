import { defineEval } from "@cursor/bdk/evals";

export default defineEval({
  tags: ["smoke", "capture"],
  description: "A messy note is stored raw and split into fact cards.",
  async test(t) {
    await t.send(
      [
        "File this work note:",
        "",
        "Tue: prod checkout 500s after the tax flag. Talked to Mateo Ruiz on Slack (@mateo, #checkout-oncall). He said flip TAX_V2_SHADOW off in the admin console, then bounce the pricing worker. Runbook: https://wiki.example.com/checkout/tax-shadow. Handy: https://grafana.example.com/d/checkout. Cheat: the flag is under Billing, Flags, not Payments. Known issue: the worker ignores the flag until restart. Don't touch the EU cluster.",
      ].join("\n"),
    );
    t.succeeded();
    t.calledTool("save_note");
    t.calledTool("save_card");
  },
});
