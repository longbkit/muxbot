import { describe, expect, test } from "bun:test";
import { runMessageCli } from "../src/control/message-cli.ts";

function createDependencies() {
  const logs: string[] = [];
  const calls: Array<{ provider: string; action: string; params: unknown }> = [];
  const replyTargets: Array<{ loadedConfig: unknown; command: unknown; accountId: string }> = [];

  const deps = {
    loadConfig: async () => ({
      configPath: "/tmp/muxbot.json",
      processedEventsPath: "/tmp/processed-events.json",
      stateDir: "/tmp/muxbot-state",
      raw: {
        session: {
          mainKey: "main",
          dmScope: "main",
          identityLinks: {},
          storePath: "/tmp/sessions.json",
        },
        tmux: {
          socketPath: "/tmp/muxbot.sock",
        },
        agents: {
          defaults: {
            workspace: "/tmp/{agentId}",
            runner: {
              command: "codex",
              args: ["-C", "{workspace}"],
              trustWorkspace: true,
              startupDelayMs: 1,
              promptSubmitDelayMs: 1,
              sessionId: {
                create: { mode: "runner", args: [] },
                capture: {
                  mode: "off",
                  statusCommand: "/status",
                  pattern: "id",
                  timeoutMs: 1,
                  pollIntervalMs: 1,
                },
                resume: { mode: "off", args: [] },
              },
            },
            stream: {
              captureLines: 10,
              updateIntervalMs: 10,
              idleTimeoutMs: 10,
              noOutputTimeoutMs: 10,
              maxRuntimeSec: 10,
              maxMessageChars: 100,
            },
            session: {
              createIfMissing: true,
              staleAfterMinutes: 60,
              name: "{sessionKey}",
            },
          },
          list: [{ id: "default" }],
        },
        bindings: [],
        control: {
          configReload: { watch: false, watchDebounceMs: 250 },
          sessionCleanup: { enabled: true, intervalMinutes: 5 },
        },
        channels: {
          slack: {
            defaultAccount: "work",
            accounts: {},
            enabled: true,
            mode: "socket",
            appToken: "",
            botToken: "",
            agentPrompt: {
              enabled: true,
              maxProgressMessages: 3,
              requireFinalResponse: true,
            },
            ackReaction: "",
            typingReaction: "",
            processingStatus: {
              enabled: true,
              status: "Working...",
              loadingMessages: [],
            },
            allowBots: false,
            replyToMode: "thread",
            channelPolicy: "allowlist",
            groupPolicy: "allowlist",
            defaultAgentId: "default",
            privilegeCommands: {
              enabled: false,
              allowUsers: [],
            },
            commandPrefixes: {
              slash: ["::", "\\"],
              bash: ["!"],
            },
            streaming: "off",
            response: "final",
            responseMode: "message-tool",
            followUp: {
              mode: "auto",
              participationTtlMin: 5,
            },
            channels: {
              C123: {
                requireMention: true,
              },
            },
            groups: {},
            directMessages: {
              enabled: true,
              policy: "pairing",
              allowFrom: [],
              requireMention: false,
            },
          },
          telegram: {
            defaultAccount: "ops",
            accounts: {},
            enabled: true,
            mode: "polling",
            botToken: "",
            agentPrompt: {
              enabled: true,
              maxProgressMessages: 3,
              requireFinalResponse: true,
            },
            allowBots: false,
            groupPolicy: "allowlist",
            defaultAgentId: "default",
            privilegeCommands: {
              enabled: false,
              allowUsers: [],
            },
            commandPrefixes: {
              slash: ["::", "\\"],
              bash: ["!"],
            },
            streaming: "off",
            response: "final",
            responseMode: "message-tool",
            followUp: {
              mode: "auto",
              participationTtlMin: 5,
            },
            polling: {
              timeoutSeconds: 20,
              retryDelayMs: 1000,
            },
            groups: {
              "-1001234567890": {
                requireMention: false,
              },
            },
            directMessages: {
              enabled: true,
              policy: "pairing",
              allowFrom: [],
              requireMention: false,
              allowBots: false,
            },
          },
        },
      },
    }),
    resolveSlackAccountConfig: (_config: unknown, accountId?: string | null) => ({
      accountId: accountId ?? "work",
      config: {
        appToken: "xapp-test",
        botToken: "xoxb-test",
      },
    }),
    resolveTelegramAccountConfig: (_config: unknown, accountId?: string | null) => ({
      accountId: accountId ?? "ops",
      config: {
        botToken: "telegram-test",
      },
    }),
    slack: {
      send: async (params: unknown) => {
        calls.push({ provider: "slack", action: "send", params });
        return { ok: true, provider: "slack", action: "send" };
      },
      poll: async (params: unknown) => {
        calls.push({ provider: "slack", action: "poll", params });
        return { ok: true };
      },
      react: async (params: unknown) => {
        calls.push({ provider: "slack", action: "react", params });
        return { ok: true };
      },
      reactions: async (params: unknown) => {
        calls.push({ provider: "slack", action: "reactions", params });
        return { ok: true };
      },
      read: async (params: unknown) => {
        calls.push({ provider: "slack", action: "read", params });
        return { ok: true };
      },
      edit: async (params: unknown) => {
        calls.push({ provider: "slack", action: "edit", params });
        return { ok: true };
      },
      delete: async (params: unknown) => {
        calls.push({ provider: "slack", action: "delete", params });
        return { ok: true };
      },
      pin: async (params: unknown) => {
        calls.push({ provider: "slack", action: "pin", params });
        return { ok: true };
      },
      unpin: async (params: unknown) => {
        calls.push({ provider: "slack", action: "unpin", params });
        return { ok: true };
      },
      pins: async (params: unknown) => {
        calls.push({ provider: "slack", action: "pins", params });
        return { ok: true };
      },
      search: async (params: unknown) => {
        calls.push({ provider: "slack", action: "search", params });
        return { ok: true };
      },
    },
    telegram: {
      send: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "send", params });
        return { ok: true, provider: "telegram", action: "send" };
      },
      poll: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "poll", params });
        return { ok: true };
      },
      react: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "react", params });
        return { ok: true };
      },
      edit: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "edit", params });
        return { ok: true };
      },
      delete: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "delete", params });
        return { ok: true };
      },
      pin: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "pin", params });
        return { ok: true };
      },
      unpin: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "unpin", params });
        return { ok: true };
      },
      pins: async (params: unknown) => {
        calls.push({ provider: "telegram", action: "pins", params });
        return { ok: true };
      },
      unsupported: async (action: string) => {
        calls.push({ provider: "telegram", action: "unsupported", params: action });
        return { ok: false, action };
      },
    },
    print: (text: string) => {
      logs.push(text);
    },
    recordConversationReply: async (params: {
      loadedConfig: unknown;
      target: unknown;
    }) => {
      replyTargets.push(params);
    },
  };

  return { deps, logs, calls, replyTargets };
}

describe("message cli", () => {
  test("prints help when no message subcommand is provided", async () => {
    const { deps, logs, calls, replyTargets } = createDependencies();

    await runMessageCli([], deps);

    expect(calls).toHaveLength(0);
    expect(logs[0]).toContain("muxbot message");
    expect(logs[0]).toContain("message send");
  });

  test("routes slack send through the resolved account config", async () => {
    const { deps, logs, calls, replyTargets } = createDependencies();

    await runMessageCli([
      "send",
      "--channel",
      "slack",
      "--account",
      "alerts",
      "--target",
      "channel:C123",
      "--message",
      "hello",
      "--thread-id",
      "171234.000100",
      "--reply-to",
      "171234.000099",
      "--media",
      "report.png",
      "--json",
    ], deps);

    expect(calls).toEqual([
      {
        provider: "slack",
        action: "send",
        params: {
          botToken: "xoxb-test",
          target: "channel:C123",
          threadId: "171234.000100",
          replyTo: "171234.000099",
          message: "hello",
          media: "report.png",
          messageId: undefined,
          emoji: undefined,
          remove: false,
          limit: undefined,
          query: undefined,
          pollQuestion: undefined,
          pollOptions: [],
        },
      },
    ]);
    expect(logs).toEqual([
      JSON.stringify({ ok: true, provider: "slack", action: "send" }, null, 2),
    ]);
    expect(replyTargets).toHaveLength(1);
    expect(replyTargets[0]?.target).toEqual({
      agentId: "default",
      sessionKey: "agent:default:slack:channel:c123:thread:171234.000100",
      mainSessionKey: "agent:default:main",
      parentSessionKey: "agent:default:slack:channel:c123",
      threadId: "171234.000100",
    });
  });

  test("routes telegram unsupported history actions through the provider guard", async () => {
    const { deps, logs, calls } = createDependencies();

    await runMessageCli([
      "read",
      "--channel",
      "telegram",
      "--target",
      "-1001234567890",
      "--account",
      "ops",
    ], deps);

    expect(calls).toEqual([
      {
        provider: "telegram",
        action: "unsupported",
        params: "read",
      },
    ]);
    expect(logs).toEqual([JSON.stringify({ ok: false, action: "read" }, null, 2)]);
  });

  test("requires --target for actionable commands", async () => {
    const { deps } = createDependencies();

    await expect(
      runMessageCli(["send", "--channel", "slack", "--message", "hello"], deps),
    ).rejects.toThrow("--target is required");
  });

  test("requires a supported channel value", async () => {
    const { deps } = createDependencies();

    await expect(
      runMessageCli(["send", "--channel", "discord", "--target", "general"], deps),
    ).rejects.toThrow("--channel <slack|telegram> is required");
  });

  test("does not stamp follow-up state for non-reply history actions", async () => {
    const { deps, replyTargets } = createDependencies();

    await runMessageCli([
      "search",
      "--channel",
      "slack",
      "--target",
      "channel:C123",
      "--query",
      "hello",
    ], deps);

    expect(replyTargets).toHaveLength(0);
  });
});
