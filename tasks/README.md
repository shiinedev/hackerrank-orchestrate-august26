# Implementation Tasks

This directory breaks the project into small, reviewable tasks. Complete them in order unless a task is marked as parallelizable.

## Runtime and package manager

The project is already scaffolded with **Bun**. Use Bun for installing dependencies, running scripts, and executing TypeScript. Do not replace the scaffold with npm or pnpm.

## Important dataset rule

Only `dataset/messages.csv` needs predictions. The other participant-facing files provide context:

- `users.csv`
- `groups.csv`
- `group_members.csv`
- `business_accounts.csv`
- `user_business_history.csv`
- `message_history.csv`
- `message_events.csv`
- `images.csv`
- `voice_notes.csv`
- `daily_notification_summary.csv`

`sample_messages.csv` is for understanding the output style and measuring development performance. Its expected labels must never be hardcoded into the production router.

## Task order

1. Verify the existing Bun TypeScript scaffold.
2. Define typed Zod schemas for all input and output records.
3. Build CSV loading and safe dataset paths.
4. Build context joins and typed domain objects.
5. Build deterministic historical retrieval.
6. Build the Vercel AI SDK and AI Gateway adapter.
7. Add text, image, and voice analysis.
8. Build the routing prompt and structured decision flow.
9. Add safety policy and output validation.
10. Write `dataset/output.csv`.
11. Build the evaluation program.
12. Add tests, documentation, and final submission checks.

Tasks 5 and 6 can be developed in parallel after tasks 1–4. Task 7 depends on task 6. Task 10 depends on tasks 8 and 9. Task 11 can start after task 2, but final evaluation depends on the complete router.
