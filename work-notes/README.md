# Work notes guide

A personal agent that files day-to-day work notes and turns them into a
field guide: how you last fixed something, who you talked to, the docs and
URLs you used, the cheat sheet, and the known issues.

## Knowledge source

`knowledge/notes/` is the versioned corpus. Two starter notes are included
and marked `sample: true`. Add your own markdown files beside them. The
format is in `knowledge/README.md`.

Notes you paste into chat are stored beside that corpus in the agent file
store, so they stay available on the next session.

## Ask it

File a note:

> Tue: VPN died after sleep. Priya in #net-help said use the split-tunnel profile. Runbook: https://intranet.example.com/runbooks/vpn-sleep

Ask for the guide:

> How did I last fix the VPN after sleep, and who did I talk to?

If the notes don't cover it, the reply starts with `Not in your notes.`

## Run

From this directory, with Node (not Bun):

```bash
npx @cursor/bdk validate
npx @cursor/bdk dev
```

Open the playground at `http://127.0.0.1:3000/playground`. A model turn needs
a Cursor credential (`npx @cursor/bdk login`). `validate` and direct tool
calls do not.

```bash
npx @cursor/bdk call search_knowledge --input '{"query":"vpn sleep"}'
```

## Defaults

Playground and HTTP only. No Slack, GitHub, or external connectors. The
model is `grok-4.5` with high effort. Facts are stored by the tools; the
model writes the guide.
