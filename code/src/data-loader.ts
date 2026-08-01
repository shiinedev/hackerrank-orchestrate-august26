import { parse } from "csv-parse/sync";
import { resolve } from "node:path";
import {
  businessAccountRowSchema,
  dailyNotificationSummaryRowSchema,
  groupMemberRowSchema,
  groupRowSchema,
  imageRowSchema,
  messageEventRowSchema,
  messageHistoryRowSchema,
  messageRowSchema,
  userBusinessHistoryRowSchema,
  userRowSchema,
  voiceNoteRowSchema,
  type BusinessAccountRow,
  type DailyNotificationSummaryRow,
  type GroupMemberRow,
  type GroupRow,
  type ImageRow,
  type MessageEventRow,
  type MessageHistoryRow,
  type MessageRow,
  type UserBusinessHistoryRow,
  type UserRow,
  type VoiceNoteRow,
} from "./schemas.ts";
import { z } from "zod";

export type LoadedDataset = {
  messages: MessageRow[];
  users: UserRow[];
  groups: GroupRow[];
  groupMembers: GroupMemberRow[];
  businessAccounts: BusinessAccountRow[];
  userBusinessHistory: UserBusinessHistoryRow[];
  messageHistory: MessageHistoryRow[];
  messageEvents: MessageEventRow[];
  images: ImageRow[];
  voiceNotes: VoiceNoteRow[];
  dailyNotificationSummary: DailyNotificationSummaryRow[];
};

const defaultDatasetDirectory = resolve(import.meta.dir, "../../dataset");

async function loadCsv<T>(
  datasetDirectory: string,
  fileName: string,
  schema: z.ZodType<T>,
): Promise<T[]> {
  const filePath = resolve(datasetDirectory, fileName);
  const fileText = await Bun.file(filePath).text();
  const rows = parse(fileText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: false,
  }) as unknown[];

  return rows.map((row, index) => {
    const result = schema.safeParse(row);
    if (!result.success) {
      throw new Error(
        `Invalid ${fileName} row ${index + 2}: ${result.error.message}`,
      );
    }
    return result.data;
  });
}

export async function loadDataset(
  datasetDirectory = defaultDatasetDirectory,
): Promise<LoadedDataset> {
  const [messages, users, groups, groupMembers, businessAccounts, userBusinessHistory, messageHistory, messageEvents, images, voiceNotes, dailyNotificationSummary] = await Promise.all([
    loadCsv(datasetDirectory, "messages.csv", messageRowSchema),
    loadCsv(datasetDirectory, "users.csv", userRowSchema),
    loadCsv(datasetDirectory, "groups.csv", groupRowSchema),
    loadCsv(datasetDirectory, "group_members.csv", groupMemberRowSchema),
    loadCsv(datasetDirectory, "business_accounts.csv", businessAccountRowSchema),
    loadCsv(datasetDirectory, "user_business_history.csv", userBusinessHistoryRowSchema),
    loadCsv(datasetDirectory, "message_history.csv", messageHistoryRowSchema),
    loadCsv(datasetDirectory, "message_events.csv", messageEventRowSchema),
    loadCsv(datasetDirectory, "images.csv", imageRowSchema),
    loadCsv(datasetDirectory, "voice_notes.csv", voiceNoteRowSchema),
    loadCsv(datasetDirectory, "daily_notification_summary.csv", dailyNotificationSummaryRowSchema),
  ]);

  return {
    messages,
    users,
    groups,
    groupMembers,
    businessAccounts,
    userBusinessHistory,
    messageHistory,
    messageEvents,
    images,
    voiceNotes,
    dailyNotificationSummary,
  };
}

