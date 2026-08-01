import { parse } from "csv-parse/sync";
import { resolve } from "node:path";
import { z } from "zod";
import { loadDataset } from "./data-loader.ts";
import { routeMessages } from "./pipeline.ts";
import { outputRowSchema, messageRowSchema, type MessageRow, type OutputRow } from "./schemas.ts";

const sampleMessageSchema = messageRowSchema.extend({
  action: z.enum(["notify", "digest", "mute"]),
  message_type: z.enum([
    "personal",
    "urgent",
    "event",
    "payment",
    "business_update",
    "promotion",
    "greeting",
    "forward",
    "spam",
    "scam",
    "unknown",
  ]),
  reason: z.string(),
  confidence: z.coerce.number().min(0).max(1),
  evidence_message_ids: z.string().min(1),
});

type SampleMessage = z.infer<typeof sampleMessageSchema>;

function parseEvidenceIds(value: string): string[] {
  if (value === "none") return [];
  return value.split(";").map((entry) => entry.trim()).filter(Boolean);
}

async function loadSampleMessages(datasetDirectory = resolve(import.meta.dir, "../../dataset")): Promise<SampleMessage[]> {
  const filePath = resolve(datasetDirectory, "sample_messages.csv");
  const fileText = await Bun.file(filePath).text();
  const rows = parse(fileText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as unknown[];

  return rows.map((row, index) => {
    const parsed = sampleMessageSchema.safeParse(row);
    if (!parsed.success) {
      throw new Error(`Invalid sample_messages.csv row ${index + 2}: ${parsed.error.message}`);
    }
    return parsed.data;
  });
}

function macroF1<T extends string>(labels: readonly T[], expected: T[], predicted: T[]): number {
  const scores = labels.map((label) => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (let index = 0; index < expected.length; index += 1) {
      const actual = expected[index] === label;
      const guess = predicted[index] === label;
      if (actual && guess) tp += 1;
      if (!actual && guess) fp += 1;
      if (actual && !guess) fn += 1;
    }
    const precision = tp === 0 ? 0 : tp / (tp + fp);
    const recall = tp === 0 ? 0 : tp / (tp + fn);
    if (precision === 0 || recall === 0) return 0;
    return (2 * precision * recall) / (precision + recall);
  });
  return scores.reduce((sum, value) => sum + value, 0) / scores.length;
}

function evidenceOverlap(expected: string, predicted: string): number {
  const expectedSet = new Set(parseEvidenceIds(expected));
  const predictedSet = new Set(parseEvidenceIds(predicted));
  if (expectedSet.size === 0 && predictedSet.size === 0) return 1;
  const intersection = [...predictedSet].filter((value) => expectedSet.has(value)).length;
  const union = new Set([...expectedSet, ...predictedSet]).size;
  return union === 0 ? 1 : intersection / union;
}

function calibrationScore(expectedAction: string[], predicted: OutputRow[]): number {
  const values = predicted.map((row, index) => {
    const correct = row.action === expectedAction[index] ? 1 : 0;
    return (row.confidence - correct) ** 2;
  });
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function schemaValidity(rows: OutputRow[]): number {
  const valid = rows.filter((row) => outputRowSchema.safeParse(row).success).length;
  return valid / rows.length;
}

export async function runEvaluation(): Promise<void> {
  const dataset = await loadDataset();
  const samples = await loadSampleMessages();
  const sampleMessages: MessageRow[] = samples.map((sample) => ({
    message_id: sample.message_id,
    user_id: sample.user_id,
    conversation_type: sample.conversation_type,
    group_id: sample.group_id,
    business_id: sample.business_id,
    sender_user_id: sample.sender_user_id,
    created_at: sample.created_at,
    message_text: sample.message_text,
    media_type: sample.media_type,
    media_id: sample.media_id,
    forwarded_count: sample.forwarded_count,
  }));

  const predicted = await routeMessages(dataset, sampleMessages);
  const expectedActions = samples.map((sample) => sample.action);
  const predictedActions = predicted.map((row) => row.action);
  const expectedTypes = samples.map((sample) => sample.message_type);
  const predictedTypes = predicted.map((row) => row.message_type);

  const actionAccuracy = predictedActions.filter((value, index) => value === expectedActions[index]).length / predicted.length;
  const messageTypeAccuracy = predictedTypes.filter((value, index) => value === expectedTypes[index]).length / predicted.length;
  const combinedAccuracy = predicted.filter((row, index) =>
    row.action === expectedActions[index] && row.message_type === expectedTypes[index]
  ).length / predicted.length;
  const evidenceMeanOverlap = predicted.reduce((sum, row, index) => {
    const sample = samples[index];
    if (!sample) {
      throw new Error(`Missing sample row at index ${index}.`);
    }
    return sum + evidenceOverlap(sample.evidence_message_ids, row.evidence_message_ids);
  }, 0) / predicted.length;

  const report = {
    sampleCount: predicted.length,
    actionAccuracy: Number(actionAccuracy.toFixed(4)),
    actionMacroF1: Number(macroF1(["notify", "digest", "mute"] as const, expectedActions, predictedActions).toFixed(4)),
    messageTypeAccuracy: Number(messageTypeAccuracy.toFixed(4)),
    messageTypeMacroF1: Number(macroF1([
      "personal",
      "urgent",
      "event",
      "payment",
      "business_update",
      "promotion",
      "greeting",
      "forward",
      "spam",
      "scam",
      "unknown",
    ] as const, expectedTypes, predictedTypes).toFixed(4)),
    combinedAccuracy: Number(combinedAccuracy.toFixed(4)),
    evidenceOverlap: Number(evidenceMeanOverlap.toFixed(4)),
    confidenceBrierLoss: Number(calibrationScore(expectedActions, predicted).toFixed(4)),
    schemaValidity: Number(schemaValidity(predicted).toFixed(4)),
  };

  console.log(JSON.stringify(report, null, 2));
}

if (import.meta.main) {
  await runEvaluation();
}
