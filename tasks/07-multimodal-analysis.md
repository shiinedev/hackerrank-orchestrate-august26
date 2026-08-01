# Task 07 — Analyze text, images, and voice notes

**Status: complete**

## Goal

Give the router usable semantic content for every supported media type.

## Work

- Use message text directly when present.
- Send referenced images to a vision-capable model.
- Transcribe voice notes, then pass the transcript to the routing analysis.
- Preserve the original message ID and media ID in the analysis context.
- Cache media analysis during one run to avoid duplicate calls.
- Use `generateText` with an image content part for vision analysis.
- Use the stable AI SDK `transcribe` function with `gateway.transcriptionModel(...)` for voice notes.

## Acceptance criteria

- All image and voice references in the dataset are handled.
- Empty message text for voice messages does not cause a crash.
- Media failures are reported clearly.
- The final explanation is based on the actual message or media content.
