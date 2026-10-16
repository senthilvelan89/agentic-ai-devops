import { defineAgent } from "@cursor/bdk";

export default defineAgent({
  description:
    "Files day-to-day work notes and turns them into a personal field guide.",
  model: {
    id: "grok-4.5",
    params: [
      { id: "effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  tools: ["read", "grep", "glob", "ls"],
});
