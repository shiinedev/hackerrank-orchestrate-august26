# TypeScript AI Message Notification Router Plan

## Summary

Build a genuinely AI-powered WhatsApp message router in TypeScript. The program will read every row from `dataset/messages.csv` and write one prediction for each row to `dataset/output.csv`.

The design combines AI for semantic and multimodal understanding with deterministic TypeScript for safety invariants, personalization data preparation, and output validation. This keeps the solution powerful but explainable for the HackerRank AI Judge interview.

## Architecture

### 1. Data loading

Read the participant-facing CSV files from `dataset/`:

- Incoming messages
- Users and notification preferences
- Groups and group memberships
- Business accounts and verification data
- User-business history
- Historical messages and message events
- Image and voice-note metadata
- Daily notification summaries

The production router must not read organizer-only files or use hardcoded message IDs or expected answers.

### 2. Media understanding

- Send text messages to the AI analyzer.
- Load image files referenced by `images.csv` and send them as multimodal input.
- Transcribe voice files referenced by `voice_notes.csv`, then analyze the transcript.
- Normalize the result into useful facts such as urgency, event type, promotion, or possible scam.

### 3. Historical retrieval

For each incoming message, retrieve relevant historical messages using the same user, sender, group, or business; similar text or meaning; similar media; and user reactions such as opened, replied, dismissed, muted, or reported.

Use the retrieved history as context for the AI and as possible values for `evidence_message_ids`. Evidence must come from `message_history.csv`; use `none` when no useful evidence exists.

### 4. Personalization context

Prepare a compact context object containing:

- User quiet hours and notification behavior
- Group role, activity, and mute state
- Business verification, domain, and report history
- User promotion opt-in or opt-out history
- Daily notification load
- Historical engagement with similar messages

### 5. AI decision

Use the Vercel AI SDK with `@ai-sdk/openai` for direct OpenAI access. Keep OpenAI model IDs configurable without rewriting the routing logic, and use Zod to describe and validate the structured AI result.

The AI decision shape is:

```ts
{
  action: "notify" | "digest" | "mute",
  messageType:
    | "personal"
    | "urgent"
    | "event"
    | "payment"
    | "business_update"
    | "promotion"
    | "greeting"
    | "forward"
    | "spam"
    | "scam"
    | "unknown",
  reason: string,
  confidence: number,
  evidenceMessageIds: string[]
}
```

The prompt will explain the three actions, allowed message types, user context, historical evidence, and safety behavior. The AI must make the semantic decision; sample expected labels must never be embedded into production logic.

### 6. Safety and validation

AI is responsible for understanding meaning and risk. TypeScript is responsible for enforcing non-negotiable boundaries and the submission contract.

Local checks will:

- Prevent an AI result that marks an obvious OTP, password, login-code, suspicious-payment, or account-blocking scam as `notify`.
- Validate the action and message type against the allowed values.
- Clamp or reject confidence outside `0` through `1`.
- Remove evidence IDs that do not exist in `message_history.csv`.
- Write `none` when no valid evidence remains.
- Keep reasons short and non-empty.
- Ensure exactly one output row exists for every incoming message.

These checks are generic safety and schema policies from the problem statement, not hidden labels. There will be no message-ID-specific predictions and no copied answers from `sample_messages.csv`.

### 7. CSV output

Write the exact columns, in this exact order:

```text
message_id,action,message_type,reason,confidence,evidence_message_ids
```

Preserve the input message order and write the final file to `dataset/output.csv`.

## TypeScript project structure

Correction: the actual terminal entry point is `code/src/index.ts`. The live Bun script runs `bun run src/index.ts`.

Replace the empty Python starter with:

- `code/src/main.ts` — terminal entry point
- `code/src/types.ts` — CSV and decision types
- `code/src/data-loader.ts` — CSV loading and joins
- `code/src/media-analyzer.ts` — image and voice processing
- `code/src/retriever.ts` — historical evidence retrieval
- `code/src/router.ts` — Vercel AI SDK calls and prompts
- `code/src/safety.ts` — safety overrides and validation
- `code/src/output.ts` — CSV writing and output checks
- `code/evaluation/evaluate.ts` — offline evaluation against solved examples
- `code/package.json` and `code/tsconfig.json`
- `code/README.md` — setup and run instructions

Use environment variables such as:

```text
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

Never store API keys in source code or commit them.

## Evaluation plan

Create a separate evaluator that runs the same router against the participant-facing `sample_messages.csv` and compares predictions with its expected answers. The production program will not read those expected labels.

Report:

- Action accuracy and macro-F1 for `notify`, `digest`, and `mute`
- Message-type accuracy
- Combined action and message-type accuracy
- Evidence overlap with the expected relevant historical IDs
- Confidence calibration, including whether high-confidence results are more often correct
- Output schema validity

Also add targeted tests for urgent school, work, family, and delivery messages; opted-out promotions; repeated forwards; scams; quiet hours; muted groups; images; and voice notes.

Because the solved sample is small, use it for development, debugging, and comparison—not as proof of hidden-test performance and not as a source of hardcoded rules.

## Test and acceptance criteria

Before submission:

- The terminal command runs from the documented directory.
- All 187 input messages produce exactly one output row.
- Output columns and allowed values are exact.
- Evidence IDs are valid or `none`.
- Images and voice notes are processed successfully.
- AI failures are reported clearly and do not silently create malformed output.
- Safety checks prevent high-risk messages from becoming `notify`.
- The evaluator and focused policy tests pass.
- The final `output.csv`, runnable code package, setup instructions, and transcript log are ready for submission.

## Trade-offs and assumptions

- AI plus deterministic checks is safer and easier to explain than AI-only routing.
- Retrieval is preferred over model training because the dataset is small and the challenge forbids hardcoded labels.
- Vercel AI Gateway is preferred over a direct provider SDK because it supports multiple providers, model switching, and fallbacks through one interface.
- The application remains a standalone TypeScript CLI; Next.js and LangChain are unnecessary for this task.
- A gateway key will be supplied through an environment variable when implementation begins.
- The exact model and fallback order will be configurable, not embedded in routing decisions.
