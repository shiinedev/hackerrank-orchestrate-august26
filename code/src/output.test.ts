import { describe, expect, test } from "bun:test";
import { serializeOutputCsv } from "./output.ts";

describe("serializeOutputCsv", () => {
  test("writes the required header and escapes commas", () => {
    const csv = serializeOutputCsv([
      {
        message_id: "msg_1",
        action: "digest",
        message_type: "promotion",
        reason: "Sale, but not urgent.",
        confidence: 0.44,
        evidence_message_ids: "none",
      },
    ]);

    expect(csv).toContain("message_id,action,message_type,reason,confidence,evidence_message_ids");
    expect(csv).toContain('"Sale, but not urgent."');
  });
});
