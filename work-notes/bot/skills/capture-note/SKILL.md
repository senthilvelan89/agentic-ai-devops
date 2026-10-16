---
description: File a messy work note into the knowledge source as a raw note plus one card per fact.
---

# Capture a work note

Use this when the user pastes notes, a recap, or "file this" / "remember this".

1. Call `save_note` with the user's text unchanged. Set `title` to a short
   label and `topic` to a kebab-case problem name. Reuse a topic already in
   the knowledge source when the note continues that problem. If you are
   unsure, call `search_knowledge` first.
2. Call `save_card` once for each distinct fact. Pass the `noteId` from
   `save_note`. Skip a kind when the note does not contain that fact.
   - `resolution` — how it was last fixed, with `steps` only when the note
     states them.
   - `contact` — a person or team, with `contactName` and `contactChannel`
     (Slack, email, phone, ticket) when stated.
   - `doc` — a named document, with `url` when the note includes a link.
   - `url` — a handy link that is not the main doc.
   - `cheat` — a shortcut, path, flag, command, or where to click.
   - `known_issue` — a caveat, outage pattern, or thing not to do.
3. Copy names, links, and steps from the note. Do not tidy a link into a
   different URL. Links stored in `url` need a scheme (`https://`).
4. Reply with a short filing receipt: the topic, the note id, and the card
   kinds you stored. Do not write the full guide unless they also asked for it.
