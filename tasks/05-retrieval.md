# Task 05 — Retrieve historical evidence

**Status: complete**

## Goal

Find relevant historical messages for personalization and evidence.

## Work

- Prefer the same user plus same sender, group, or business.
- Score recency and lexical similarity.
- Include reaction signals such as opened, replied, dismissed, muted, and reported.
- Return a stable, bounded list of historical records.
- Return only IDs from `message_history.csv` as evidence candidates.

## Acceptance criteria

- Retrieval is deterministic for the same input.
- Results are bounded and do not exceed the prompt budget.
- No sample expected labels are used for retrieval or prediction.
