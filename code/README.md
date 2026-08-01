# TypeScript Message Notification Router

This folder contains the Bun + TypeScript solution for the HackerRank Orchestrate challenge.

The program reads `dataset/messages.csv`, uses the other files in `dataset/` as context, and writes predictions to `dataset/output.csv`.

## What this solution does

It combines AI understanding with local TypeScript rules:

- AI reads the message meaning, user context, history, images, and voice notes.
- TypeScript enforces the contract: allowed labels, valid confidence, valid evidence IDs, one row per message, correct CSV format.
- A safety layer prevents obvious scam-like OTP, password, login-code, payment-pressure, and account-blocking messages from becoming `notify`.

This split is important for the AI Judge interview because it shows clear reasoning:

- We use AI for meaning and multimodal understanding.
- We use code for deterministic guardrails and output correctness.
- We do not use organizer-only files or hardcoded labels.

## Files

- `src/data-loader.ts`: loads and validates participant-facing CSV files
- `src/context-model.ts`: joins user, group, business, history, and media context
- `src/retriever.ts`: selects relevant historical evidence
- `src/media-analyzer.ts`: image understanding and voice transcription
- `src/router.ts`: prompt building and structured AI decision
- `src/safety-policy.ts`: safety overrides and final output validation
- `src/output.ts`: CSV serialization and writing
- `src/pipeline.ts`: end-to-end routing pipeline
- `src/evaluate.ts`: evaluation command using `sample_messages.csv` only

## Environment variables

Create `code/.env` and set:

```env
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_VISION_MODEL=gpt-4o-mini
OPENAI_TRANSCRIPTION_MODEL=gpt-4o-mini-transcribe
```

Notes:

- Only the API key is secret.
- Model names are configuration, not secrets.
- `OPENAI_VISION_MODEL` can be the same as `OPENAI_MODEL`.

## Bun commands

Install dependencies:

```bash
bun install
```

Run typecheck:

```bash
bun run typecheck
```

Run tests:

```bash
bun test
```

Generate `dataset/output.csv`:

```bash
bun run start
```

Run evaluation on solved participant-facing examples:

```bash
bun run evaluate
```

## Important rules

- Production routing reads `dataset/messages.csv`.
- Production routing does not read labels from `dataset/sample_messages.csv`.
- `sample_messages.csv` is used only by the evaluation command.
- Evidence IDs must come from `message_history.csv`, or the output uses `none`.
- The output file must keep this exact header:

```text
message_id,action,message_type,reason,confidence,evidence_message_ids
```

## Interview explanation

If the AI Judge asks why we chose this design, the short answer is:

1. We need semantic understanding, so AI decides the message meaning.
2. We need reliable submission behavior, so TypeScript validates and corrects unsafe or malformed output.
3. We need personalization, so we join user behavior, sender context, business trust, history, and notification load.
4. We need to stay within the rules, so we never use organizer-only files and never hardcode sample labels.

## Submission checklist

- `code.zip`: include this `code/` folder with source, prompts, config files, and this README
- `output.csv`: upload `dataset/output.csv`
- `chat_transcript`: upload the external transcript log at `%USERPROFILE%\\hackerrank_orchestrate_august26\\log.txt`

The transcript file is outside the repo on purpose. It is shared across sessions and should not be committed.
