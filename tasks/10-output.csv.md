# Task 10 — Generate `dataset/output.csv`

**Status: complete**

## Goal

Produce the only required prediction file.

## Work

- Iterate over every row in `dataset/messages.csv`.
- Produce exactly one decision per `message_id`.
- Preserve input row order.
- Write the exact required header:

```text
message_id,action,message_type,reason,confidence,evidence_message_ids
```

- Escape CSV content correctly.

## Acceptance criteria

- Output row count equals input row count.
- Every input message ID appears exactly once.
- The file is written to `dataset/output.csv`.
- `none` is used when there is no useful evidence.
