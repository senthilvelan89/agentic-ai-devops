---
description: Turn knowledge-source hits into a polished field guide for one problem.
---

# Write the field guide

Use this when the user asks how something was resolved, who to contact, which
doc or URL to use, for a cheat sheet, for known issues, or for "the guide".

1. Call `search_knowledge` with their words. Add `kind` or `topic` only when
   they named one. Ignore hits that do not answer the question.
2. If no hit answers it, reply with this first line and nothing else about
   the facts: `Not in your notes.`
3. If every fact you use has `sample: true`, the first line is exactly
   `Sample starter note — not your own history.`
4. Otherwise write the guide in this order. Omit a section with no card.
   Prefer the card with the latest `updatedAt` when several resolutions exist,
   and mention older ones in one sentence.

```markdown
# <topic title>

## How it was last resolved
## Who to contact
## Key docs
## Handy URLs
## Cheat sheet
## Known issues
```

5. Put the direct answer in the matching section, in plain sentences. Keep
   URLs and contact channels exactly as stored. Attribute a sample fact as a
   starter example inside its section when live notes and samples are mixed.
6. A narrow question still uses this shape, with only the sections you have
   facts for. Do not add sections from guesswork.
