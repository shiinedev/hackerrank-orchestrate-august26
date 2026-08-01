import { resolve } from "node:path";
import type { OutputRow } from "./schemas.ts";
import { validateOutputRows } from "./safety-policy.ts";

function escapeCsvField(value: string | number): string {
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

export function serializeOutputCsv(rows: OutputRow[]): string {
  const header = "message_id,action,message_type,reason,confidence,evidence_message_ids";
  const body = rows.map((row) =>
    [
      row.message_id,
      row.action,
      row.message_type,
      row.reason,
      row.confidence,
      row.evidence_message_ids,
    ].map(escapeCsvField).join(",")
  );
  return `${[header, ...body].join("\n")}\n`;
}

export async function writeOutputCsv(
  rows: OutputRow[],
  messageIds: string[],
  outputPath = resolve(import.meta.dir, "../../dataset/output.csv"),
): Promise<void> {
  validateOutputRows(messageIds, rows);
  await Bun.write(outputPath, serializeOutputCsv(rows));
}
