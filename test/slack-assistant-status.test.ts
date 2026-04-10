import { describe, expect, test } from "bun:test";
import {
  buildSlackAssistantStatusRequest,
  clearSlackAssistantThreadStatus,
} from "../src/channels/slack/assistant-status.ts";

describe("slack assistant status", () => {
  test("builds a status request from enabled config", () => {
    expect(
      buildSlackAssistantStatusRequest(
        {
          enabled: true,
          status: "Working...",
          loadingMessages: ["Reviewing context...", "Preparing response..."],
        },
        {
          channel: "C123",
          threadTs: "1775395740.108729",
        },
      ),
    ).toEqual({
      channel_id: "C123",
      thread_ts: "1775395740.108729",
      status: "Working...",
      loading_messages: ["Reviewing context...", "Preparing response..."],
    });
  });

  test("skips status when disabled or missing thread timestamp", () => {
    expect(
      buildSlackAssistantStatusRequest(
        {
          enabled: false,
          status: "Working...",
          loadingMessages: [],
        },
        {
          channel: "C123",
          threadTs: "1775395740.108729",
        },
      ),
    ).toBeNull();

    expect(
      buildSlackAssistantStatusRequest(
        {
          enabled: true,
          status: "Working...",
          loadingMessages: [],
        },
        {
          channel: "C123",
        },
      ),
    ).toBeNull();
  });

  test("clears assistant thread status with an empty string", async () => {
    const calls: Array<{ channel_id: string; thread_ts: string; status: string }> = [];
    const client = {
      assistant: {
        threads: {
          setStatus: async (args: {
            channel_id: string;
            thread_ts: string;
            status: string;
          }) => {
            calls.push(args);
          },
        },
      },
    };

    const cleared = await clearSlackAssistantThreadStatus(client, {
      channel: "C123",
      threadTs: "1775395740.108729",
    });

    expect(cleared).toBe(true);
    expect(calls).toEqual([
      {
        channel_id: "C123",
        thread_ts: "1775395740.108729",
        status: "",
      },
    ]);
  });
});
