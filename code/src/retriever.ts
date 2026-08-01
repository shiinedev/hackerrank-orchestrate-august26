import type { MessageContext } from "./context-model.ts";
import type { MessageEventRow, MessageHistoryRow } from "./schemas.ts";

export type RetrievedEvidence = {
  message: MessageHistoryRow;
  event?: MessageEventRow;
  score: number;
  reasons: string[];
};

export type RetrievalOptions = {
  limit?: number;
};

function normalizeTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length >= 3),
  );
}

function lexicalScore(query: Set<string>, candidate: Set<string>): number {
  if (query.size === 0 || candidate.size === 0) return 0;
  let overlap = 0;
  for (const token of query) {
    if (candidate.has(token)) overlap += 1;
  }
  return overlap / Math.max(query.size, candidate.size);
}

function recencyScore(createdAt: string): number {
  const time = Date.parse(createdAt.replace(" ", "T"));
  if (Number.isNaN(time)) return 0;
  const ageDays = Math.max(0, (Date.now() - time) / 86_400_000);
  return Math.max(0, 1 - ageDays / 180);
}

function findEvent(events: MessageEventRow[], messageId: string): MessageEventRow | undefined {
  return events.find((event) => event.message_id === messageId);
}

function scoreEvidence(
  context: MessageContext,
  message: MessageHistoryRow,
  event: MessageEventRow | undefined,
): RetrievedEvidence {
  const query = normalizeTokens(`${context.message.message_text} ${context.message.media_type}`);
  const candidate = normalizeTokens(`${message.message_text} ${message.media_type}`);
  const reasons: string[] = [];
  let score = lexicalScore(query, candidate) * 4;

  if (message.sender_user_id && message.sender_user_id === context.message.sender_user_id) {
    score += 3;
    reasons.push("same sender");
  }
  if (message.group_id && message.group_id === context.message.group_id) {
    score += 2;
    reasons.push("same group");
  }
  if (message.business_id && message.business_id === context.message.business_id) {
    score += 3;
    reasons.push("same business");
  }
  if (message.media_type && message.media_type === context.message.media_type) {
    score += 0.5;
    reasons.push("same media type");
  }

  score += recencyScore(message.created_at);
  if (event?.message_replied) {
    score += 1;
    reasons.push("user replied before");
  }
  if (event?.message_reported) {
    score += 1;
    reasons.push("user reported before");
  }
  if (event?.muted_after_message || event?.notification_dismissed) {
    reasons.push("user dismissed or muted before");
  }

  return { message, event, score, reasons };
}

export function retrieveEvidence(
  context: MessageContext,
  options: RetrievalOptions = {},
): RetrievedEvidence[] {
  const limit = options.limit ?? 5;

  return context.relatedHistory
    .map((message) => scoreEvidence(context, message, findEvent(context.relatedEvents, message.message_id)))
    .sort((left, right) => right.score - left.score || left.message.message_id.localeCompare(right.message.message_id))
    .slice(0, limit);
}

