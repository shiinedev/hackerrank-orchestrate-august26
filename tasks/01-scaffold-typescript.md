# Task 01 — Verify the existing Bun TypeScript scaffold

**Status: complete**

## Goal

Confirm that the existing Bun-generated TypeScript project is suitable for this solution. The scaffold already exists and must be preserved.

## Work

- Keep the existing `code/package.json`.
- Keep the existing `code/tsconfig.json`, including strict type checking.
- Inspect the existing source and test layout before adding files.
- Add only the scripts and folders that are missing.
- Add `.env.example` with variable names only.
- Do not add real API keys.

## Runtime commands

Use Bun commands, for example:

- `bun install`
- `bun run <script>`
- `bun test`
- `bunx tsc --noEmit`

Do not use npm or pnpm commands for this project.

## Acceptance criteria

- The existing Bun scaffold remains intact.
- Required dependencies are installed with Bun.
- TypeScript checks succeed with strict settings.
- The CLI runs through Bun.
- No Python runtime is required.
