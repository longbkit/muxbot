import { afterEach, describe, expect, test } from "bun:test";
import { TelegramApiError } from "../src/channels/telegram/api.ts";
import { postTelegramText } from "../src/channels/telegram/transport.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("telegram html transport", () => {
  test("sends html wire payload with parse_mode HTML when html wire format is enabled", async () => {
    const payloads: Array<Record<string, unknown>> = [];

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      payloads.push(JSON.parse(String(init?.body ?? "{}")));
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: 101,
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

    const posted = await postTelegramText({
      token: "telegram-token",
      chatId: 123,
      text: "<b>Title</b>\n\n• <b>Bold</b> item",
      wireFormat: "html",
    });

    expect(payloads).toEqual([
      {
        chat_id: 123,
        parse_mode: "HTML",
        text: "<b>Title</b>\n\n• <b>Bold</b> item",
      },
    ]);
    expect(posted).toEqual([
      {
        messageId: 101,
        text: "<b>Title</b>\n\n• <b>Bold</b> item",
      },
    ]);
  });

  test("falls back to plain text when Telegram rejects the html payload", async () => {
    const payloads: Array<Record<string, unknown>> = [];
    let attempt = 0;

    globalThis.fetch = (async (_input: string | URL | Request, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body ?? "{}"));
      payloads.push(payload);
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
            message_id: 202,
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

    const posted = await postTelegramText({
      token: "telegram-token",
      chatId: 456,
      text: "<b>Title</b>\n\n• item",
      wireFormat: "html",
    });

    expect(payloads).toEqual([
      {
        chat_id: 456,
        parse_mode: "HTML",
        text: "<b>Title</b>\n\n• item",
      },
      {
        chat_id: 456,
        text: "<b>Title</b>\n\n• item",
      },
    ]);
    expect(posted).toEqual([
      {
        messageId: 202,
        text: "<b>Title</b>\n\n• item",
      },
    ]);
  });

  test("does not swallow unrelated Telegram API failures", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          ok: false,
          error_code: 400,
          description: "Bad Request: chat not found",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json",
          },
        },
      )) as unknown as typeof fetch;

    await expect(
      postTelegramText({
        token: "telegram-token",
        chatId: 789,
        text: "hello",
        wireFormat: "html",
      }),
    ).rejects.toThrow(TelegramApiError);
  });
});
