# Task 03 — Load the participant-facing dataset

**Status: complete**

## Goal

Load all allowed context files while predicting only `dataset/messages.csv`.

## Work

- Resolve the dataset path from the project location or a CLI option.
- Load each CSV with `csv-parse`.
- Validate rows with the Zod schemas.
- Build typed lookup maps by ID.
- Validate that referenced images and voice files exist.
- Keep organizer-only files outside the loading code.

## Acceptance criteria

- The loader reports useful file and row errors.
- `messages.csv` is the only source of prediction rows.
- All context files can be accessed through typed maps.
- No labels from `sample_messages.csv` enter production prediction context.
