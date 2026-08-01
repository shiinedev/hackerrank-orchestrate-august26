# Task 06 — Add the Vercel AI SDK and Gateway adapter

**Status: complete**

## Goal

Create one direct OpenAI client for text, structured decisions, images, and voice workflows within the existing Bun TypeScript project.

## Work

- Use `ai` and `@ai-sdk/openai`.
- Read `OPENAI_API_KEY` and `OPENAI_MODEL` from the environment.
- Keep model selection configurable.
- Add timeout and retry behavior appropriate for a 24-hour batch run.
- Keep the adapter independent from routing policy.

## Acceptance criteria

- Missing credentials fail with a clear setup message.
- The router can change OpenAI model IDs without changing domain types.
- AI responses are generated with `generateText` and `Output.object({ schema })`, then validated through the Zod decision schema.
- Do not use deprecated `generateObject` or `streamObject` APIs.
- No secret is printed or written to the repository.
