import { describe, expect, test } from "bun:test";
import { resolveSlackMessageContent } from "../src/channels/slack/content.ts";

describe("resolveSlackMessageContent", () => {
  test("renders markdown to Slack mrkdwn for native mode", () => {
    const resolved = resolveSlackMessageContent({
      text: "## Title\n- **Bold** item\n[site](https://example.com)",
      inputFormat: "md",
      renderMode: "native",
    });

    expect(resolved).toEqual({
      text: "*Title*\n• *Bold* item\n<https://example.com|site>",
    });
  });

  test("renders markdown to Slack blocks when requested", () => {
    const resolved = resolveSlackMessageContent({
      text: "## Title\n\n### Details\n- first\n- second",
      inputFormat: "md",
      renderMode: "blocks",
    });

    expect(resolved.text).toBe("Title");
    expect(resolved.apiText).toBe("\u200B");
    expect(resolved.blocks).toEqual([
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Title",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Details*",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "• first\n• second",
        },
      },
    ]);
  });

  test("adds dividers between major sections and bold-flattens deeper headings", () => {
    const resolved = resolveSlackMessageContent({
      text: [
        "## First",
        "Intro one.",
        "",
        "#### Note",
        "Body one.",
        "",
        "## Second",
        "Intro two.",
      ].join("\n"),
      inputFormat: "md",
      renderMode: "blocks",
    });

    expect(resolved.blocks).toEqual([
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "First",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Intro one.",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Note*\nBody one.",
        },
      },
      {
        type: "divider",
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Second",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Intro two.",
        },
      },
    ]);
  });

  test("renders a leading preamble paragraph as context before the first heading", () => {
    const resolved = resolveSlackMessageContent({
      text: [
        "[clisbot format test] Slack heading hierarchy markdown -> blocks",
        "",
        "## Vì sao flow này ổn",
        "Body.",
      ].join("\n"),
      inputFormat: "md",
      renderMode: "blocks",
    });

    expect(resolved.text).toBe("[clisbot format test] Slack heading hierarchy markdown -> blocks");
    expect(resolved.blocks).toEqual([
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "[clisbot format test] Slack heading hierarchy markdown -> blocks",
          },
        ],
      },
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Vì sao flow này ổn",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Body.",
        },
      },
    ]);
  });

  test("passes raw Slack blocks through and derives fallback text", () => {
    const resolved = resolveSlackMessageContent({
      text: JSON.stringify([
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Ship It",
          },
        },
      ]),
      inputFormat: "blocks",
      renderMode: "none",
    });

    expect(resolved).toEqual({
      text: "Ship It",
      apiText: "\u200B",
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "Ship It",
          },
        },
      ],
    });
  });
});
