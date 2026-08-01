# Task 11 — Build the evaluation program

**Status: complete**

## Goal

Measure development quality using the solved participant-facing examples without leaking their labels into production.

## Work

- Load `sample_messages.csv` only in the evaluation command.
- Run the same routing pipeline on those message records.
- Compare predicted and expected actions and message types.
- Report action accuracy, macro-F1, message-type accuracy, combined accuracy, evidence overlap, confidence calibration, and schema validity.
- Add focused policy fixtures for scams, urgent school/work/family messages, promotions, repeated forwards, quiet hours, images, and voice notes.

## Acceptance criteria

- Production code does not read expected labels from `sample_messages.csv`.
- Evaluation output clearly separates model quality from formatting failures.
- The evaluator can be run with `bun run evaluate`.
- Results are reproducible for the same model and data.
