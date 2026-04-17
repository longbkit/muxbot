import { afterEach, describe, expect, test } from "bun:test";
import {
  editTelegramMessage,
  sendTelegramMessage,
} from "../src/channels/telegram/message-actions.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("telegram message actions", () => {
  test("renders markdown as html-safe telegram text for direct sends", async () => {
    const payloads: Array<Record<string, unknown>> = [];

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      payloads.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: 401,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }) as unknown as typeof fetch;

    await sendTelegramMessage({
      botToken: "telegram-token",
      target: "-1003455688247",
      threadId: "1230",
      message: "# Title\n## Section\n### Detail",
    });

    expect(payloads).toEqual([
      {
        chat_id: -1003455688247,
        message_thread_id: 1230,
        parse_mode: "HTML",
        text: "<b>Title</b>\n\n<b>Section</b>\n\n<b>Detail</b>",
      },
    ]);
  });

  test("falls back to plain text when telegram rejects html-safe message-tool output", async () => {
    const payloads: Array<Record<string, unknown>> = [];
    let attempt = 0;

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      payloads.push(JSON.parse(String(init?.body ?? "{}")));
      attempt += 1;
      if (attempt === 1) {
        return new Response(
          JSON.stringify({
            ok: false,
            error_code: 400,
            description: "Bad Request: can't parse entities: Unsupported start tag",
          }),
          {
            status: 400,
            headers: {
              "content-type": "application/json",
            },
          },
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: 402,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }) as unknown as typeof fetch;

    await sendTelegramMessage({
      botToken: "telegram-token",
      target: "12345",
      message: "# Title",
    });

    expect(payloads).toEqual([
      {
        chat_id: 12345,
        parse_mode: "HTML",
        text: "<b>Title</b>",
      },
      {
        chat_id: 12345,
        text: "# Title",
      },
    ]);
  });

  test("renders markdown as html-safe telegram text for edits", async () => {
    const payloads: Array<Record<string, unknown>> = [];

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      payloads.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: 403,
          },
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      );
    }) as unknown as typeof fetch;

    await editTelegramMessage({
      botToken: "telegram-token",
      target: "-1003455688247",
      messageId: "555",
      message: "## Section\n- item",
    });

    expect(payloads).toEqual([
      {
        chat_id: -1003455688247,
        message_id: 555,
        parse_mode: "HTML",
        text: "<b>Section</b>\n\n• item",
      },
    ]);
  });
});
