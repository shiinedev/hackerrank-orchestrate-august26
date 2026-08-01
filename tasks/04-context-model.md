# Task 04 — Build the typed context model

**Status: complete**

## Goal

Join each incoming message to the user, group, business, media, history, events, and notification context needed by the AI.

## Work

- Build a `MessageContext` domain type.
- Resolve group membership for group messages.
- Resolve business history for business messages.
- Attach relevant daily notification summary.
- Attach historical messages and reaction events.
- Keep absent relationships as explicit `undefined` or empty collections.

## Acceptance criteria

- Context construction never crashes because an optional relationship is absent.
- User, group, business, and historical context can be inspected in logs during development without exposing secrets.
- Context is compact enough to send to the model.
