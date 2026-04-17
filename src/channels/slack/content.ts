import type { MessageInputFormat, MessageRenderMode } from "../message-command.ts";

export type SlackBlock = Record<string, unknown>;

const SLACK_MAX_BLOCKS = 50;

function normalizeMarkdownLinks(text: string) {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label: string, href: string) => {
    const trimmedHref = href.trim();
    if (!trimmedHref) {
      return label;
    }
    return `<${trimmedHref}|${label}>`;
  });
}

function renderInlineMarkdownToSlackMrkdwn(text: string) {
  return normalizeMarkdownLinks(text)
    .replace(/~~([^~]+)~~/g, "~$1~")
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "*$1*");
}

function stripMarkdownInline(text: string) {
  return text
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1")
    .replace(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "$1")
    .replace(/\*([^*\n][\s\S]*?[^*\n])\*/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .trim();
}

function normalizeSlackHeaderText(text: string) {
  const normalized = stripMarkdownInline(text);
  if (!normalized) {
    return "Untitled";
  }
  return normalized.slice(0, 150);
}

function buildSlackBlocksFallbackText(blocks: SlackBlock[]): string {
  for (const block of blocks) {
    if (typeof block !== "object" || !block) {
      continue;
    }
    const text = (block as { text?: { text?: string } }).text?.text;
    if (typeof text === "string" && text.trim()) {
      return stripMarkdownInline(text).replace(/\s+/g, " ").trim();
    }
    const elements = (block as { elements?: Array<{ text?: string }> }).elements;
    if (!Array.isArray(elements)) {
      continue;
    }
    for (const element of elements) {
      if (typeof element?.text === "string" && element.text.trim()) {
        return stripMarkdownInline(element.text).replace(/\s+/g, " ").trim();
      }
    }
  }
  return "Shared a Block Kit message";
}

function validateSlackBlocksArray(raw: unknown): SlackBlock[] {
  if (!Array.isArray(raw)) {
    throw new Error("Slack blocks input must be a JSON array");
  }
  if (raw.length === 0) {
    throw new Error("Slack blocks input cannot be empty");
  }
  if (raw.length > SLACK_MAX_BLOCKS) {
    throw new Error(`Slack blocks cannot exceed ${SLACK_MAX_BLOCKS} items`);
  }
  for (const block of raw) {
    if (!block || typeof block !== "object" || Array.isArray(block)) {
      throw new Error("Each Slack block must be an object");
    }
    const type = (block as { type?: unknown }).type;
    if (typeof type !== "string" || !type.trim()) {
      throw new Error("Each Slack block must include a non-empty string type");
    }
  }
  return raw as SlackBlock[];
}

function parseSlackBlocksInput(text: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Slack blocks input must be valid JSON");
  }
  return validateSlackBlocksArray(parsed);
}

function renderMarkdownToSlackMrkdwn(markdown: string) {
  const normalized = markdown.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
  if (!normalized) {
    return "";
  }

  return normalized
    .split("\n")
    .map((line) => {
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1]?.length ?? 1;
        const content = renderInlineMarkdownToSlackMrkdwn(headingMatch[2] ?? "");
        if (level <= 3) {
          return `*${content}*`;
        }
        return content;
      }

      const bulletMatch = line.match(/^\s*[-*+]\s+(.+)$/);
      if (bulletMatch) {
        return `• ${renderInlineMarkdownToSlackMrkdwn(bulletMatch[1] ?? "")}`;
      }

      const orderedMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
      if (orderedMatch) {
        return `${orderedMatch[1]}. ${renderInlineMarkdownToSlackMrkdwn(orderedMatch[2] ?? "")}`;
      }

      return renderInlineMarkdownToSlackMrkdwn(line);
    })
    .join("\n");
}

function renderMarkdownToSlackBlocks(markdown: string) {
  const normalized = markdown.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
  if (!normalized) {
    return [];
  }

  const blocks: SlackBlock[] = [];
  const lines = normalized.split("\n");
  const firstHeadingLineIndex = lines.findIndex((line) => /^(#{1,6})\s+.+$/.test(line));
  const paragraph: string[] = [];
  const codeLines: string[] = [];
  let inCodeFence = false;
  let hasVisibleContent = false;
  let hasSeenHeading = false;
  let majorHeadingCount = 0;

  const pushBlock = (block: SlackBlock) => {
    blocks.push(block);
    hasVisibleContent = true;
  };

  const pushDividerIfNeeded = () => {
    if (!hasVisibleContent) {
      return;
    }
    const lastBlock = blocks[blocks.length - 1];
    if ((lastBlock as { type?: string } | undefined)?.type === "divider") {
      return;
    }
    blocks.push({ type: "divider" });
  };

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }
    const text = paragraph.join("\n").trim();
    if (text) {
      const shouldRenderAsPreamble =
        !hasSeenHeading && firstHeadingLineIndex > 0 && blocks.length === 0;
      pushBlock({
        ...(shouldRenderAsPreamble
          ? {
              type: "context",
              elements: [
                {
                  type: "mrkdwn",
                  text,
                },
              ],
            }
          : {
              type: "section",
              text: {
                type: "mrkdwn",
                text,
              },
            }),
      });
    }
    paragraph.length = 0;
  };

  const flushCodeFence = () => {
    if (codeLines.length === 0) {
      return;
    }
    pushBlock({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `\`\`\`\n${codeLines.join("\n")}\n\`\`\``,
      },
    });
    codeLines.length = 0;
  };

  for (const line of lines) {
    const fenceMatch = line.match(/^```([^\n`]*)$/);
    if (fenceMatch) {
      if (inCodeFence) {
        flushCodeFence();
        inCodeFence = false;
      } else {
        flushParagraph();
        inCodeFence = true;
      }
      continue;
    }

    if (inCodeFence) {
      codeLines.push(line);
      continue;
    }

    if (line.trim().length === 0) {
      flushParagraph();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      hasSeenHeading = true;
      const level = headingMatch[1]?.length ?? 1;
      const content = headingMatch[2] ?? "";
      if (level <= 2) {
        if (majorHeadingCount > 0) {
          pushDividerIfNeeded();
        }
        pushBlock({
          type: "header",
          text: {
            type: "plain_text",
            text: normalizeSlackHeaderText(content),
          },
        });
        majorHeadingCount += 1;
      } else if (level === 3) {
        pushBlock({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*${renderInlineMarkdownToSlackMrkdwn(content)}*`,
          },
        });
      } else {
        paragraph.push(`*${renderInlineMarkdownToSlackMrkdwn(content)}*`);
      }
      continue;
    }

    const bulletMatch = line.match(/^\s*[-*+]\s+(.+)$/);
    if (bulletMatch) {
      paragraph.push(`• ${renderInlineMarkdownToSlackMrkdwn(bulletMatch[1] ?? "")}`);
      continue;
    }

    const orderedMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
    if (orderedMatch) {
      paragraph.push(
        `${orderedMatch[1]}. ${renderInlineMarkdownToSlackMrkdwn(orderedMatch[2] ?? "")}`,
      );
      continue;
    }

    paragraph.push(renderInlineMarkdownToSlackMrkdwn(line));
  }

  if (inCodeFence) {
    flushCodeFence();
  }
  flushParagraph();
  return blocks;
}

export type SlackResolvedMessageContent = {
  text: string;
  blocks?: SlackBlock[];
  apiText?: string;
};

export function resolveSlackMessageContent(params: {
  text: string;
  inputFormat: MessageInputFormat;
  renderMode: MessageRenderMode;
}): SlackResolvedMessageContent {
  const { text, inputFormat, renderMode } = params;

  if (inputFormat === "blocks") {
    if (renderMode !== "none" && renderMode !== "blocks") {
      throw new Error("Slack blocks input supports only --render none or --render blocks");
    }
    const blocks = parseSlackBlocksInput(text);
    return {
      text: buildSlackBlocksFallbackText(blocks),
      blocks,
      apiText: "\u200B",
    };
  }

  if (inputFormat === "html") {
    throw new Error("Slack does not support HTML input; use --input md, mrkdwn, plain, or blocks");
  }

  if (renderMode === "blocks") {
    const blocks = renderMarkdownToSlackBlocks(text);
    return {
      text: buildSlackBlocksFallbackText(blocks),
      blocks,
      apiText: "\u200B",
    };
  }

  if (renderMode === "html") {
    throw new Error("Slack does not support --render html");
  }

  if (inputFormat === "mrkdwn" || renderMode === "mrkdwn") {
    return { text };
  }

  if (inputFormat === "md" || renderMode === "native") {
    return {
      text: renderMarkdownToSlackMrkdwn(text),
    };
  }

  return { text };
}
