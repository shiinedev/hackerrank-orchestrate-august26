# Task 02 — Define typed Zod schemas

**Status: complete**

## Goal

Represent the problem statement exactly and make invalid CSV data visible early.

## Required input schema

Define a Zod schema for each `dataset/messages.csv` row:

- `message_id: string`
- `user_id: string`
- `conversation_type: "personal" | "group" | "business"`
- `group_id: string | empty`
- `business_id: string | empty`
- `sender_user_id: string | empty`
- `created_at: string`
- `message_text: string`
- `media_type: empty | "image" | "voice"`
- `media_id: string | empty`
- `forwarded_count: integer >= 0`

Also define schemas for all context CSV rows. Keep CSV values as strings at the parsing boundary, then transform numeric flags and counts into typed values.

## Required output schema

Define the exact output shape:

- `message_id: string`
- `action: "notify" | "digest" | "mute"`
- `message_type: "personal" | "urgent" | "event" | "payment" | "business_update" | "promotion" | "greeting" | "forward" | "spam" | "scam" | "unknown"`
- `reason: non-empty string`
- `confidence: number between 0 and 1`
- `evidence_message_ids: string`, containing semicolon-separated IDs or `none`

## Acceptance criteria

- Invalid action or message type fails validation.
- Missing optional CSV fields are handled consistently as empty strings.
- Numeric fields are converted safely.
- Input and output types are exported from one typed module.
- The AI response schema is separate from the CSV output schema, then converted through a checked mapping.
- AI-facing fields use descriptions so structured-output models understand the meaning of each decision field.
