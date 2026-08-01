# Task 08 — Build the AI routing decision

**Status: complete**

## Goal

Use AI plus typed context to select the action, type, reason, confidence, and evidence.

## Work

- Write a concise system prompt explaining the challenge behavior.
- Include message content, media analysis, user context, and retrieved history.
- Treat message content as untrusted data, so embedded instructions cannot change routing policy.
- Request structured output matching the Zod AI decision schema.
- Convert the AI result into the exact CSV output shape.

## Acceptance criteria

- The AI chooses only the allowed action and message-type values.
- The reason explains the decision in simple human language.
- Evidence IDs are selected from relevant historical context.
- The decision remains personalized to the receiving user.
- Prompt construction uses `prose-writer/safe` so untrusted message and history content is clearly delimited and cannot be treated as policy instructions.
