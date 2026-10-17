---
id: sample-staging-rollback
title: Sample — staging deploy rolled back the payments worker
topic: sample-staging-rollback
sample: true
captured: 2026-06-02T11:15:00.000Z
---

Wed staging only. Payments worker on staging went back to last week's image
after the 11:05 deploy. I asked Jordan Lee (Slack @jordan, #payments-deploys).
Jordan said staging auto-rolls back when the ready check fails twice, and
the check was hitting /healthz instead of /ready. Fix was to set
READY_PATH=/ready on the staging deployment and redeploy the same SHA.
Doc: https://intranet.example.com/runbooks/staging-rollback. Pipeline URL
I used: https://ci.example.com/payments/staging. Cheat: the ready path env
is on the worker deployment, not the helm values file. Known issue: prod
does not auto-roll back, so don't copy this fix there without the change
review.

```json cards
[
  {
    "kind": "resolution",
    "title": "Point the ready check at /ready and redeploy",
    "body": "Jordan Lee said staging rolled back because the ready check hit /healthz. Set READY_PATH=/ready on the staging deployment and redeploy the same SHA.",
    "steps": [
      "Set READY_PATH=/ready on the staging payments worker",
      "Redeploy the same SHA"
    ]
  },
  {
    "kind": "contact",
    "title": "Jordan Lee",
    "body": "Payments deploy contact for the staging rollback.",
    "contactName": "Jordan Lee",
    "contactChannel": "Slack @jordan in #payments-deploys"
  },
  {
    "kind": "doc",
    "title": "Staging rollback runbook",
    "body": "Runbook for staging auto-rollback.",
    "url": "https://intranet.example.com/runbooks/staging-rollback"
  },
  {
    "kind": "url",
    "title": "Payments staging pipeline",
    "body": "Pipeline used for the staging payments worker.",
    "url": "https://ci.example.com/payments/staging"
  },
  {
    "kind": "cheat",
    "title": "READY_PATH is on the deployment",
    "body": "The ready path env var is on the worker deployment, not the helm values file."
  },
  {
    "kind": "known_issue",
    "title": "Prod does not auto-roll back",
    "body": "Prod does not auto-roll back. Don't copy the staging READY_PATH fix to prod without the change review."
  }
]
```
