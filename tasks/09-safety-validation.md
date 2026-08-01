# Task 09 — Add safety policy and output validation

**Status: complete**

## Goal

Protect users from unsafe notification decisions and protect the CSV contract.

## Work

- Ask AI to assess scam and safety risk.
- Add generic TypeScript checks for OTP, password, login-code, suspicious-payment, and account-blocking pressure.
- Do not use message-ID-specific rules or sample-answer mappings.
- Prevent high-risk content from becoming `notify`.
- Validate all final fields with Zod.
- Validate evidence IDs against historical messages.

## Acceptance criteria

- Safety checks are policy checks, not hardcoded hidden labels.
- Invalid AI output cannot produce malformed CSV.
- High-risk messages are muted with an appropriate scam or spam type.
- Safe ambiguous messages can remain `digest` or `unknown` when appropriate.
