import type { MessageContext } from "./context-model.ts";
import type { MediaUnderstanding } from "./media-analyzer.ts";
import { aiDecisionSchema, outputRowSchema, type AiDecision, type OutputRow } from "./schemas.ts";

const otpPattern = /\b(otp|one[ -]?time password|verification code|verify code|login code|security code|passcode)\b/i;
const passwordPattern = /\b(password|pin)\b/i;
const accountPressurePattern = /\b(account|wallet|upi|bank|card|profile).{0,40}\b(block|blocked|suspend|suspended|close|closed|freeze|frozen|disable|disabled)\b/i;
const urgentPressurePattern = /\b(immediately|urgent|right now|within \d+ (minute|min|minutes|hour|hours)|or else|final warning|last warning)\b/i;
const paymentPattern = /\b(pay|payment|transfer|upi|bank|refund|settlement|invoice|fee|charges?)\b/i;
const linkPattern = /\b(https?:\/\/|www\.|bit\.ly|tinyurl|t\.co)\b/i;
const suspiciousLinkPattern = /\b(bit\.ly|tinyurl|t\.co)\b/i;
const sensitiveCodeRequestPattern = /\b(?:share|send|reply(?:\s+with)?|provide|give|confirm|verify|enter|submit)\b.{0,50}\b(?:otp|one[ -]?time password|verification code|verify code|login code|security code|passcode)\b|\b(?:otp|one[ -]?time password|verification code|verify code|login code|security code|passcode)\b.{0,50}\b(?:share|send|reply|provide|give|confirm|verify|enter|submit)\b/i;
const credentialRequestPattern = /\b(?:share|send|reply(?:\s+with)?|provide|give|enter|submit)\b.{0,50}\b(?:password|pin)\b|\b(?:password|pin)\b.{0,50}\b(?:share|send|reply|provide|give|enter|submit)\b/i;
const paymentRequestPattern = /\b(?:pay|transfer|send|settle|clear)\b.{0,50}\b(?:payment|amount|fee|charges?|invoice|upi|bank|card)\b|\b(?:payment|amount|fee|charges?|invoice|upi|bank|card)\b.{0,50}\b(?:pay|transfer|send|settle|clear)\b/i;
const chainMessagePattern = /\b(?:share with everyone|share this with|forward (?:this )?to (?:all|everyone|\d+ people)|send this to \d+|chain message|break the chain)\b/i;
const rewardClaimPattern = /\b(?:free reward|prize|winner|cash reward|gift card|claim (?:your )?(?:reward|prize))\b/i;
const promptInjectionPattern = /\b(?:ignore (?:all )?(?:previous|prior) instructions|system prompt|developer message|jailbreak|act as (?:the )?system)\b/i;

export type SafetyAssessment = {
  highRisk: boolean;
  riskType?: "scam" | "spam";
  riskSignals: string[];
};

function combinedContent(context: MessageContext, media?: MediaUnderstanding): string {
  return [
    context.message.message_text,
    media?.transcript ?? "",
    media?.image?.description ?? "",
    media?.image?.visibleText ?? "",
    ...(media?.image?.riskSignals ?? []),
  ]
    .join("\n")
    .toLowerCase();
}

export function assessSafetyRisk(
  context: MessageContext,
  media?: MediaUnderstanding,
): SafetyAssessment {
  const text = combinedContent(context, media);
  const riskSignals: string[] = [];

  const hasOtp = otpPattern.test(text);
  const hasPassword = passwordPattern.test(text);
  const hasAccountPressure = accountPressurePattern.test(text);
  const hasUrgentPressure = urgentPressurePattern.test(text);
  const hasPayment = paymentPattern.test(text);
  const hasLink = linkPattern.test(text);
  const hasSuspiciousLink = suspiciousLinkPattern.test(text);
  const requestsSensitiveCode = sensitiveCodeRequestPattern.test(text);
  const requestsCredential = credentialRequestPattern.test(text);
  const requestsPayment = paymentRequestPattern.test(text);
  const hasChainLanguage = chainMessagePattern.test(text);
  const hasRewardClaim = rewardClaimPattern.test(text);
  const hasPromptInjection = promptInjectionPattern.test(text);

  if (requestsSensitiveCode) riskSignals.push("sensitive_code_request");
  if (requestsCredential) riskSignals.push("password_or_pin_request");
  if (hasAccountPressure) riskSignals.push("account_blocking_pressure");
  if (requestsPayment && hasUrgentPressure) riskSignals.push("urgent_payment_pressure");
  if (hasSuspiciousLink) riskSignals.push("suspicious_shortened_link");
  if (hasPromptInjection) riskSignals.push("prompt_injection_content");

  const businessMismatch = Boolean(
    context.business &&
      context.business.domain_used_by_sender &&
      context.business.official_domain &&
      context.business.domain_used_by_sender !== context.business.official_domain,
  );
  if (businessMismatch) riskSignals.push("domain_mismatch");

  const reportedBusiness = Boolean(context.business && context.business.user_reports_30d > 0);
  if (reportedBusiness) riskSignals.push("recent_user_reports");

  const trustedBusiness = Boolean(
    context.business?.verified &&
      context.business.official_domain &&
      context.business.domain_used_by_sender === context.business.official_domain &&
      context.business.account_age_days >= 30 &&
      context.userBusinessHistory,
  );
  const suspiciousSender = !trustedBusiness || businessMismatch || hasSuspiciousLink || reportedBusiness;
  const sensitiveRequest = requestsSensitiveCode || requestsCredential;
  const urgentAccountThreat = hasAccountPressure && hasUrgentPressure;
  const suspiciousPaymentPressure = requestsPayment && (hasUrgentPressure || hasLink || businessMismatch);

  // Words such as "OTP", "payment", and "password" may appear in legitimate
  // safety advice or account updates. Override the AI only for an actual request
  // combined with sender, link, pressure, or prompt-injection risk.
  const highRisk = (
    sensitiveRequest && (suspiciousSender || hasPromptInjection) ||
    urgentAccountThreat && (suspiciousSender || hasLink || hasPromptInjection) ||
    suspiciousPaymentPressure && (suspiciousSender || hasPromptInjection) ||
    hasPromptInjection && sensitiveRequest
  );

  if (highRisk) {
    return { highRisk: true, riskType: "scam", riskSignals };
  }

  const highForwardSpamSignal = hasChainLanguage ||
    hasRewardClaim ||
    hasSuspiciousLink ||
    sensitiveRequest ||
    suspiciousPaymentPressure ||
    hasPromptInjection;
  const spamRisk = (context.message.forwarded_count >= 3 && highForwardSpamSignal) || (
    context.message.forwarded_count > 0 &&
    hasSuspiciousLink &&
    (hasChainLanguage || hasRewardClaim || sensitiveRequest || hasPromptInjection) &&
    !context.userBusinessHistory
  );

  if (spamRisk) {
    if (!riskSignals.includes("mass_forward_signal")) riskSignals.push("mass_forward_signal");
    return { highRisk: true, riskType: "spam", riskSignals };
  }

  return { highRisk: false, riskSignals };
}

function normalizeReason(reason: string, fallback: string): string {
  const normalized = reason.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function filterEvidenceIds(context: MessageContext, evidenceMessageIds: string[]): string[] {
  const allowedIds = new Set(context.relatedHistory.map((message) => message.message_id));
  const uniqueIds = new Set<string>();
  for (const evidenceId of evidenceMessageIds) {
    if (allowedIds.has(evidenceId)) uniqueIds.add(evidenceId);
  }
  return [...uniqueIds];
}

export function finalizeDecision(
  context: MessageContext,
  decision: AiDecision,
  media?: MediaUnderstanding,
): OutputRow {
  const parsedDecision = aiDecisionSchema.parse(decision);
  const safety = assessSafetyRisk(context, media);

  const filteredEvidenceIds = filterEvidenceIds(context, parsedDecision.evidenceMessageIds);
  let action = parsedDecision.action;
  let messageType = parsedDecision.messageType;
  let reason = normalizeReason(parsedDecision.reason, "The message was routed using message content and user context.");
  let confidence = clampConfidence(parsedDecision.confidence);

  if (safety.highRisk) {
    action = "mute";
    messageType = safety.riskType ?? "scam";
    reason = `Muted because the message shows ${safety.riskSignals.join(", ")}.`;
    confidence = Math.max(confidence, 0.85);
  }

  const output = outputRowSchema.parse({
    message_id: context.message.message_id,
    action,
    message_type: messageType,
    reason,
    confidence: Number(confidence.toFixed(2)),
    evidence_message_ids: filteredEvidenceIds.length > 0 ? filteredEvidenceIds.join(";") : "none",
  });

  return output;
}

export function validateOutputRows(messageIds: string[], rows: OutputRow[]): void {
  if (rows.length !== messageIds.length) {
    throw new Error(`Output row count mismatch. Expected ${messageIds.length}, received ${rows.length}.`);
  }

  const seen = new Set<string>();
  rows.forEach((row, index) => {
    outputRowSchema.parse(row);
    if (row.message_id !== messageIds[index]) {
      throw new Error(`Output order mismatch at row ${index + 2}. Expected ${messageIds[index]}, received ${row.message_id}.`);
    }
    if (seen.has(row.message_id)) {
      throw new Error(`Duplicate output row for message_id ${row.message_id}.`);
    }
    seen.add(row.message_id);
  });
}
