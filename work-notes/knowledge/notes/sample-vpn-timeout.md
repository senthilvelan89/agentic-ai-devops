---
id: sample-vpn-timeout
title: Sample — VPN drops after laptop sleep
topic: sample-vpn-timeout
sample: true
captured: 2026-03-12T18:40:00.000Z
---

Tue after standup. Laptop slept, VPN dead, Outlook and the build network
both gone. Pinged Priya Shah in Slack #net-help (@priya). She said don't
reinstall Cisco. Open the client, pick the "split-tunnel" profile, connect,
then run the renew script once. Full writeup is the VPN sleep runbook
https://intranet.example.com/runbooks/vpn-sleep. Status page I keep handy:
https://status.example.com/vpn. Cheat: the profile list is under the gear,
not the big Connect button. Known issue: the tunnel stays up in the menu
for about a minute after sleep even though traffic is already black-holed.
Don't file a Sev-1 for that minute.

```json cards
[
  {
    "kind": "resolution",
    "title": "Reconnect with the split-tunnel profile",
    "body": "Priya Shah said not to reinstall Cisco. Pick the split-tunnel profile, connect, then run the renew script once.",
    "steps": [
      "Open the Cisco client",
      "Choose the split-tunnel profile under the gear",
      "Connect",
      "Run the renew script once"
    ]
  },
  {
    "kind": "contact",
    "title": "Priya Shah",
    "body": "Network help who walked through the post-sleep VPN drop.",
    "contactName": "Priya Shah",
    "contactChannel": "Slack @priya in #net-help"
  },
  {
    "kind": "doc",
    "title": "VPN sleep runbook",
    "body": "Writeup for the laptop-sleep VPN drop.",
    "url": "https://intranet.example.com/runbooks/vpn-sleep"
  },
  {
    "kind": "url",
    "title": "VPN status page",
    "body": "Handy status page for the VPN service.",
    "url": "https://status.example.com/vpn"
  },
  {
    "kind": "cheat",
    "title": "Profile list is under the gear",
    "body": "The split-tunnel profile is under the gear icon, not the big Connect button."
  },
  {
    "kind": "known_issue",
    "title": "Menu lies for a minute after sleep",
    "body": "The tunnel stays up in the menu for about a minute after sleep even though traffic is already black-holed. Don't file a Sev-1 for that minute."
  }
]
```
