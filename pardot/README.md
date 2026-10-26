# Pardot (Account Engagement): form handler

A **new** form handler replaced the old one instead of repairing it. The old handler had accumulated completion actions and automations, including a webinar autoresponder, that fired for demo requests.

## Configuration

| Setting | Value |
|---|---|
| Fields | `Email-address` → Email (required, email format) · `Select-Country` → Country |
| Completion actions | Add to Salesforce campaign *Global \| Demo Request* with status **Demo Requested** · set Lead Source |
| Autoresponders, lists, tags | None |

Only fields the script actually sends are mapped. An extra mapping such as `Add to newsletter` was removed, because no field on the form ever filled it.

## Why a fresh handler

- The old handler's completion actions sent a webinar confirmation to demo prospects.
- Other automations listened to it, and to the `Tag` / `Asset` fields it influenced.
- A clean handler with one completion action makes the demo flow independent of that history.

## Verification

A test submission from staging with an existing prospect's email:
- appeared on the new handler,
- added the prospect to the campaign as *Demo Requested*,
- kept the prospect's earlier activity history, because the submission is added to the same prospect and not overwritten,
- sent no webinar email (after the Zap fix in [`../zapier/`](../zapier/)).
