---
id: payments-api-oom
title: Staging payments-api CrashLoop after helm bump
topic: payments-api-oom
sample: false
captured: 2026-10-16T16:40:00.000Z
---

thurs ~4:40pm. staging deploy of payments-api went red after the helm bump. pods CrashLoop, exit 137, not an app panic.

pinged Asha Rahman in #platform-deploys (@asha). she said don't roll the chart back yet. the new requests.memory is 128Mi and the jvm still wants ~400. set resources.requests.memory to 512Mi on the payments-api deployment in deploy/staging/payments-values.yaml, then re-run the staging pipeline. same sha, 9f3c1ab.

runbook she sent: https://intranet.example.com/runbooks/oom-crashloop
pipeline i used: https://ci.example.com/payments-api/staging

cheat: the limit that matters is requests.memory, not limits.memory. limits was already 1Gi and looked fine in lens.

known issue: if you only patch the live deployment, argocd puts the 128Mi back in about 3 min. change the values file or it loops again. don't touch prod values, prod is still on the old chart.

```json cards
[
  {
    "kind": "resolution",
    "title": "Raise the staging memory request and redeploy the same SHA",
    "body": "Asha Rahman said not to roll the chart back. requests.memory was 128Mi and the JVM still wants about 400. Set resources.requests.memory to 512Mi on the payments-api deployment in deploy/staging/payments-values.yaml, then re-run the staging pipeline on SHA 9f3c1ab.",
    "steps": [
      "Set resources.requests.memory to 512Mi in deploy/staging/payments-values.yaml",
      "Re-run the staging pipeline for SHA 9f3c1ab"
    ]
  },
  {
    "kind": "contact",
    "title": "Asha Rahman",
    "body": "Platform deploys contact for the payments-api CrashLoop after the helm bump.",
    "contactName": "Asha Rahman",
    "contactChannel": "Slack @asha in #platform-deploys"
  },
  {
    "kind": "doc",
    "title": "OOM CrashLoop runbook",
    "body": "Runbook Asha sent for the exit 137 CrashLoop.",
    "url": "https://intranet.example.com/runbooks/oom-crashloop"
  },
  {
    "kind": "url",
    "title": "Payments-api staging pipeline",
    "body": "Pipeline used to redeploy payments-api on staging.",
    "url": "https://ci.example.com/payments-api/staging"
  },
  {
    "kind": "cheat",
    "title": "requests.memory is the value that matters",
    "body": "The limit that matters is requests.memory, not limits.memory. limits was already 1Gi and looked fine in Lens."
  },
  {
    "kind": "known_issue",
    "title": "Argo CD reverts a live memory patch",
    "body": "If you only patch the live deployment, Argo CD puts the 128Mi request back in about 3 minutes. Change the values file or it loops again. Don't touch prod values; prod is still on the old chart."
  }
]
```
