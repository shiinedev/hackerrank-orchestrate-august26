import { describe, expect, test } from "bun:test";
import { finalizeDecision, validateOutputRows } from "./safety-policy.ts";
import type { MessageContext } from "./context-model.ts";
import type { AiDecision, MessageRow, OutputRow } from "./schemas.ts";

function createContext(overrides: Partial<MessageRow> = {}): MessageContext {
  return {
    message: {
      message_id: "msg_test",
      user_id: "u_001",
      conversation_type: "business",
      group_id: "",
      business_id: "business_001",
      sender_user_id: "",
      created_at: "2026-07-31 09:00",
      message_text: "Your OTP is 123456. Verify now or your account will be blocked.",
      media_type: "",
      media_id: "",
      forwarded_count: 0,
      ...overrides,
    },
    user: {
      user_id: "u_001",
      do_not_disturb_window: "23:00-07:00",
      messages_opened_30d: 10,
      messages_replied_30d: 3,
      notifications_dismissed_30d: 5,
      messages_reported_30d: 1,
    },
    business: {
      business_id: "business_001",
      display_name: "PayFast",
      brand_name: "PayFast",
      category: "payments",
      verified: false,
      official_domain: "payfast.com",
      domain_used_by_sender: "payfast-secure.co",
      account_age_days: 4,
      messages_sent_30d: 20,
      user_reports_30d: 2,
      domain_used_by_sender_age_days: 2,
    },
    relatedHistory: [
      {
        message_id: "message_0001",
        user_id: "u_001",
        conversation_type: "business",
        group_id: "",
        business_id: "business_001",
        sender_user_id: "",
        created_at: "2026-07-30 10:00",
        message_text: "Previous payment update",
        media_type: "",
        media_id: "",
        forwarded_count: 0,
      },
    ],
    relatedEvents: [],
  };
}

describe("finalizeDecision", () => {
  test("forces high-risk OTP content to mute as scam", () => {
    const context = createContext();
    const decision: AiDecision = {
      action: "notify",
      messageType: "payment",
      reason: "This looks urgent.",
      confidence: 0.42,
      evidenceMessageIds: ["message_0001"],
    };

    const result = finalizeDecision(context, decision);

    expect(result.action).toBe("mute");
    expect(result.message_type).toBe("scam");
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.evidence_message_ids).toBe("message_0001");
  });

  test("filters invalid evidence ids and writes none when nothing valid remains", () => {
    const context = createContext({
      message_text: "Dinner at 8? Call me when free.",
      conversation_type: "personal",
      business_id: "",
      sender_user_id: "u_099",
    });
    const decision: AiDecision = {
      action: "digest",
      messageType: "personal",
      reason: "Normal personal message.",
      confidence: 0.7,
      evidenceMessageIds: ["missing_id"],
    };

    const result = finalizeDecision(context, decision);
    expect(result.evidence_message_ids).toBe("none");
  });

  test("marks repeated suspicious forwards as spam", () => {
    const context = createContext({
      message_text: "Forward this to everyone and click this link for a free reward",
      conversation_type: "group",
      group_id: "group_001",
      business_id: "",
      forwarded_count: 6,
    });
    const decision: AiDecision = {
      action: "digest",
      messageType: "forward",
      reason: "Maybe useful forward.",
      confidence: 0.55,
      evidenceMessageIds: [],
    };

    const result = finalizeDecision(context, decision);
    expect(result.action).toBe("mute");
    expect(result.message_type).toBe("spam");
  });
});

describe("validateOutputRows", () => {
  test("accepts valid ordered rows", () => {
    const rows: OutputRow[] = [
      {
        message_id: "msg_1",
        action: "notify",
        message_type: "urgent",
        reason: "Time-sensitive message.",
        confidence: 0.9,
        evidence_message_ids: "none",
      },
    ];

    expect(() => validateOutputRows(["msg_1"], rows)).not.toThrow();
  });

  test("rejects duplicate message ids", () => {
    const rows: OutputRow[] = [
      {
        message_id: "msg_1",
        action: "notify",
        message_type: "urgent",
        reason: "First row.",
        confidence: 0.9,
        evidence_message_ids: "none",
      },
      {
        message_id: "msg_2",
        action: "digest",
        message_type: "unknown",
        reason: "Duplicate row.",
        confidence: 0.4,
        evidence_message_ids: "none",
      },
      {
        message_id: "msg_2",
        action: "digest",
        message_type: "unknown",
        reason: "Duplicate row.",
        confidence: 0.4,
        evidence_message_ids: "none",
      },
    ];

    expect(() => validateOutputRows(["msg_1", "msg_2", "msg_2"], rows)).toThrow("Duplicate output row");
  });
});
