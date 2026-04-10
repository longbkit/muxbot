import { afterEach, describe, expect, test } from "bun:test";
import { buildAgentPromptText } from "../src/channels/agent-prompt.ts";

describe("agent prompt envelope", () => {
  let previousWrapperPath: string | undefined;

  afterEach(() => {
    process.env.MUXBOT_WRAPPER_PATH = previousWrapperPath;
  });

  test("renders a Slack reply command for the current thread", () => {
    previousWrapperPath = process.env.MUXBOT_WRAPPER_PATH;
    process.env.MUXBOT_WRAPPER_PATH = "/tmp/muxbot-wrapper";

    const prompt = buildAgentPromptText({
      text: "please investigate",
      identity: {
        platform: "slack",
        conversationKind: "channel",
        senderId: "U123",
        channelId: "C123",
        threadTs: "171234.5678",
      },
      config: {
        enabled: true,
        maxProgressMessages: 3,
        requireFinalResponse: true,
      },
      responseMode: "message-tool",
    });

    expect(prompt).toContain("<system>");
    expect(prompt).toContain("Use the exact local muxbot wrapper");
    expect(prompt).toContain("channel auto-delivery is disabled for this conversation");
    expect(prompt).toContain("/tmp/muxbot-wrapper message send \\");
    expect(prompt).toContain("  --channel slack \\");
    expect(prompt).toContain("  --target channel:C123 \\");
    expect(prompt).toContain("  --thread-id 171234.5678 \\");
    expect(prompt).toContain("--message \"$(cat <<'__MUXBOT_MESSAGE__'");
    expect(prompt).toContain("__MUXBOT_MESSAGE__");
    expect(prompt).toContain("progress updates: at most 3");
    expect(prompt).toContain("final response: send exactly 1 final user-facing response");
    expect(prompt).toContain("use plain ASCII spaces in the shell command");
    expect(prompt).toContain("<user>\nplease investigate\n</user>");
  });

  test("renders a Telegram topic reply command", () => {
    previousWrapperPath = process.env.MUXBOT_WRAPPER_PATH;
    process.env.MUXBOT_WRAPPER_PATH = "/tmp/muxbot-wrapper";

    const prompt = buildAgentPromptText({
      text: "ship it",
      identity: {
        platform: "telegram",
        conversationKind: "topic",
        senderId: "123",
        chatId: "-1001",
        topicId: "4",
      },
      config: {
        enabled: true,
        maxProgressMessages: 2,
        requireFinalResponse: true,
      },
      responseMode: "message-tool",
    });

    expect(prompt).toContain("/tmp/muxbot-wrapper message send \\");
    expect(prompt).toContain("  --channel telegram \\");
    expect(prompt).toContain("  --target -1001 \\");
    expect(prompt).toContain("  --thread-id 4 \\");
    expect(prompt).toContain("Telegram topic 4 in chat -1001");
  });

  test("returns the raw text when the prompt envelope is disabled", () => {
    const prompt = buildAgentPromptText({
      text: "plain text",
      identity: {
        platform: "slack",
        conversationKind: "dm",
      },
      config: {
        enabled: false,
        maxProgressMessages: 3,
        requireFinalResponse: true,
      },
    });

    expect(prompt).toBe("plain text");
  });
});
