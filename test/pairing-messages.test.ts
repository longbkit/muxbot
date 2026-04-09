import { describe, expect, test } from "bun:test";
import { buildPairingReply } from "../src/channels/pairing/messages.ts";

describe("buildPairingReply", () => {
  test("renders the concrete approval command with the issued code", () => {
    const text = buildPairingReply({
      channel: "slack",
      idLine: "Your Slack user id: U123",
      code: "EUQZL644",
    });

    expect(text).toContain("Pairing code: EUQZL644");
    expect(text).toContain("muxbot pairing approve slack EUQZL644");
    expect(text).not.toContain("muxbot pairing approve slack <code>");
  });
});
