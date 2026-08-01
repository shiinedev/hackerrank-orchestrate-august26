import type {
  BusinessAccountRow,
  DailyNotificationSummaryRow,
  GroupMemberRow,
  GroupRow,
  ImageRow,
  MessageEventRow,
  MessageHistoryRow,
  MessageRow,
  UserBusinessHistoryRow,
  UserRow,
  VoiceNoteRow,
} from "./schemas.ts";
import type { LoadedDataset } from "./data-loader.ts";

export type MessageContext = {
  message: MessageRow;
  user?: UserRow;
  group?: GroupRow;
  groupMembership?: GroupMemberRow;
  business?: BusinessAccountRow;
  userBusinessHistory?: UserBusinessHistoryRow;
  dailyNotificationSummary?: DailyNotificationSummaryRow;
  media?: ImageRow | VoiceNoteRow;
  relatedHistory: MessageHistoryRow[];
  relatedEvents: MessageEventRow[];
};

function messageDate(createdAt: string): string {
  return createdAt.slice(0, 10);
}

function sameConversation(message: MessageRow, history: MessageHistoryRow): boolean {
  if (message.conversation_type !== history.conversation_type) return false;
  if (message.group_id && message.group_id === history.group_id) return true;
  if (message.business_id && message.business_id === history.business_id) return true;
  if (message.sender_user_id && message.sender_user_id === history.sender_user_id) return true;
  return message.conversation_type === "personal" && message.user_id === history.user_id;
}

export function buildMessageContext(
  dataset: LoadedDataset,
  message: MessageRow,
): MessageContext {
  const relatedHistory = dataset.messageHistory.filter(
    (history) => history.user_id === message.user_id && sameConversation(message, history),
  );
  const historyIds = new Set(relatedHistory.map((history) => history.message_id));

  const media = message.media_type === "image"
    ? dataset.images.find((image) => image.image_id === message.media_id)
    : message.media_type === "voice"
      ? dataset.voiceNotes.find((voiceNote) => voiceNote.voice_note_id === message.media_id)
      : undefined;

  return {
    message,
    user: dataset.users.find((user) => user.user_id === message.user_id),
    group: message.group_id
      ? dataset.groups.find((group) => group.group_id === message.group_id)
      : undefined,
    groupMembership: message.group_id
      ? dataset.groupMembers.find(
        (member) => member.group_id === message.group_id && member.user_id === message.user_id,
      )
      : undefined,
    business: message.business_id
      ? dataset.businessAccounts.find((business) => business.business_id === message.business_id)
      : undefined,
    userBusinessHistory: message.business_id
      ? dataset.userBusinessHistory.find(
        (history) => history.user_id === message.user_id && history.business_id === message.business_id,
      )
      : undefined,
    dailyNotificationSummary: dataset.dailyNotificationSummary.find(
      (summary) => summary.user_id === message.user_id && summary.date === messageDate(message.created_at),
    ),
    media,
    relatedHistory,
    relatedEvents: dataset.messageEvents.filter((event) => historyIds.has(event.message_id)),
  };
}

export function buildAllMessageContexts(dataset: LoadedDataset): MessageContext[] {
  return dataset.messages.map((message) => buildMessageContext(dataset, message));
}

