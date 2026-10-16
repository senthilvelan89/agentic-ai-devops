# Knowledge source

This folder is the versioned work-notes corpus. The agent reads every
`notes/*.md` file through `search_knowledge`, then merges notes and cards
filed later in chat.

Chat filings live in the agent file store (`knowledge/notes/` and
`knowledge/cards/` on the deployment scope). They are not written back into
git. Drop a markdown file here when you want the note in source control.

## Note file

Start with front matter, then the raw note, then a fenced block whose
info string is `json cards`:

    ---
    id: checkout-tax-shadow
    title: Checkout 500s after the tax flag
    topic: checkout-tax-shadow
    sample: false
    captured: 2026-10-16T15:00:00.000Z
    ---

    Raw note, in the words you wrote it.

    ```json cards
    [
      {
        "kind": "resolution",
        "title": "Turn the shadow flag off and bounce pricing",
        "body": "Mateo said to flip TAX_V2_SHADOW off, then restart the pricing worker.",
        "steps": ["Open Billing → Flags", "Set TAX_V2_SHADOW off", "Restart pricing"]
      },
      {
        "kind": "contact",
        "title": "Mateo Ruiz",
        "body": "Checkout oncall who walked through the tax-flag outage.",
        "contactName": "Mateo Ruiz",
        "contactChannel": "Slack @mateo in #checkout-oncall"
      }
    ]
    ```

`kind` is one of `resolution`, `contact`, `doc`, `url`, `cheat`,
`known_issue`. `sample: true` marks a starter example. The agent will say so
instead of treating it as your own history.

The two files already in `notes/` are starters. Replace them with your own
notes, or leave them and file real ones in chat.
