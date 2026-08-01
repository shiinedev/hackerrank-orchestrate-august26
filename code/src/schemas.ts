import { z } from "zod";

const emptyString = z.string();
const csvInteger = z.coerce.number().int();
const csvFlag = z.union([z.literal("0"), z.literal("1")]).transform((value) => value === "1");

export const conversationTypeSchema = z
  .enum(["personal", "group", "business"])
  .describe("The kind of WhatsApp conversation that produced the message.");
export const mediaTypeSchema = z
  .enum(["", "image", "voice"])
  .describe("The attached media type. Empty means the message has no media.");

export const messageTypeSchema = z
  .enum([
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
  ])
  .describe("The best-fit category describing the message content and purpose.");

export const actionSchema = z
  .enum(["notify", "digest", "mute"])
  .describe("The notification routing action for the receiving user.");

export const messageRowSchema = z.object({
  message_id: z.string().min(1),
  user_id: z.string().min(1),
  conversation_type: conversationTypeSchema,
  group_id: emptyString,
  business_id: emptyString,
  sender_user_id: emptyString,
  created_at: z.string().min(1),
  message_text: z.string(),
  media_type: mediaTypeSchema,
  media_id: emptyString,
  forwarded_count: csvInteger.nonnegative(),
});

export const userRowSchema = z.object({
  user_id: z.string().min(1),
  do_not_disturb_window: z.string(),
  messages_opened_30d: csvInteger.nonnegative(),
  messages_replied_30d: csvInteger.nonnegative(),
  notifications_dismissed_30d: csvInteger.nonnegative(),
  messages_reported_30d: csvInteger.nonnegative(),
});

export const groupRowSchema = z.object({
  group_id: z.string().min(1),
  group_name: z.string(),
  group_type: z.string(),
  member_count: csvInteger.nonnegative(),
  admin_count: csvInteger.nonnegative(),
  created_at: z.string().min(1),
  messages_30d: csvInteger.nonnegative(),
});

export const groupMemberRowSchema = z.object({
  group_id: z.string().min(1),
  user_id: z.string().min(1),
  role: z.string(),
  joined_at: z.string().min(1),
  messages_sent_30d: csvInteger.nonnegative(),
  messages_read_30d: csvInteger.nonnegative(),
  replies_sent_30d: csvInteger.nonnegative(),
  notifications_dismissed_30d: csvInteger.nonnegative(),
  group_muted_by_user: csvFlag,
});

export const businessAccountRowSchema = z.object({
  business_id: z.string().min(1),
  display_name: z.string(),
  brand_name: z.string(),
  category: z.string(),
  verified: csvFlag,
  official_domain: z.string(),
  domain_used_by_sender: z.string(),
  account_age_days: csvInteger.nonnegative(),
  messages_sent_30d: csvInteger.nonnegative(),
  user_reports_30d: csvInteger.nonnegative(),
  domain_used_by_sender_age_days: csvInteger.nonnegative(),
});

export const userBusinessHistoryRowSchema = z.object({
  user_id: z.string().min(1),
  business_id: z.string().min(1),
  why_user_knows_account: z.string(),
  last_activity_at: z.string(),
  allows_promotions: csvFlag,
  promotions_opted_out_at: z.string(),
  activity_count_180d: csvInteger.nonnegative(),
  messages_opened_30d: csvInteger.nonnegative(),
  messages_dismissed_30d: csvInteger.nonnegative(),
  messages_replied_30d: csvInteger.nonnegative(),
  last_reply_at: z.string(),
});

export const messageHistoryRowSchema = messageRowSchema;

export const messageEventRowSchema = z.object({
  user_id: z.string().min(1),
  message_id: z.string().min(1),
  message_opened: csvFlag,
  message_replied: csvFlag,
  reaction_time_minutes: csvInteger.nonnegative(),
  notification_dismissed: csvFlag,
  muted_after_message: csvFlag,
  message_reported: csvFlag,
});

export const imageRowSchema = z.object({
  image_id: z.string().min(1),
  file_path: z.string().min(1),
});

export const voiceNoteRowSchema = z.object({
  voice_note_id: z.string().min(1),
  file_path: z.string().min(1),
});

export const dailyNotificationSummaryRowSchema = z.object({
  user_id: z.string().min(1),
  date: z.string().min(1),
  notifications_sent: csvInteger.nonnegative(),
  notifications_dismissed: csvInteger.nonnegative(),
});

export const aiDecisionSchema = z
  .object({
    action: actionSchema.describe(
      "Choose notify only when the message deserves interruption now; choose digest for safe useful content that can wait; choose mute for unwanted, repetitive, suspicious, scam-like, or unsafe content.",
    ),
    messageType: messageTypeSchema.describe(
      "Classify the message by its main purpose. Use scam or spam for risky or unwanted content, urgent for time-sensitive action, and unknown only when the content cannot be classified reliably.",
    ),
    reason: z
      .string()
      .trim()
      .min(1)
      .describe("A short, human-readable explanation based on message content and user context."),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("A calibrated confidence score from 0 to 1 for this complete decision."),
    evidenceMessageIds: z
      .array(z.string().min(1))
      .describe("Relevant historical message IDs that support the decision; use an empty array when none are useful."),
  })
  .describe("The final personalized routing decision for one incoming WhatsApp message.");

export const mediaAnalysisSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1)
      .describe("A concise description of the important content visible in the image."),
    visibleText: z
      .string()
      .describe("Text read from the image, including dates, prices, deadlines, links, or requests."),
    riskSignals: z
      .array(z.string().min(1))
      .describe("Visible signs of scams, suspicious payments, unsafe instructions, or other risk."),
    categoryHints: z
      .array(messageTypeSchema)
      .describe("Possible message categories suggested by the media content."),
  })
  .describe("Structured visual understanding of an image attached to a WhatsApp message.");

export const outputRowSchema = z.object({
  message_id: z.string().min(1),
  action: actionSchema,
  message_type: messageTypeSchema,
  reason: z.string().trim().min(1),
  confidence: z.number().min(0).max(1),
  evidence_message_ids: z.string().min(1),
});

export type MessageRow = z.infer<typeof messageRowSchema>;
export type UserRow = z.infer<typeof userRowSchema>;
export type GroupRow = z.infer<typeof groupRowSchema>;
export type GroupMemberRow = z.infer<typeof groupMemberRowSchema>;
export type BusinessAccountRow = z.infer<typeof businessAccountRowSchema>;
export type UserBusinessHistoryRow = z.infer<typeof userBusinessHistoryRowSchema>;
export type MessageHistoryRow = z.infer<typeof messageHistoryRowSchema>;
export type MessageEventRow = z.infer<typeof messageEventRowSchema>;
export type ImageRow = z.infer<typeof imageRowSchema>;
export type VoiceNoteRow = z.infer<typeof voiceNoteRowSchema>;
export type DailyNotificationSummaryRow = z.infer<typeof dailyNotificationSummaryRowSchema>;
export type AiDecision = z.infer<typeof aiDecisionSchema>;
export type MediaAnalysis = z.infer<typeof mediaAnalysisSchema>;
export type OutputRow = z.infer<typeof outputRowSchema>;
