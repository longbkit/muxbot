const TOKEN_PREFIX = "\u0000TGH";

type TelegramRenderedLine =
  | { kind: "blank"; text: "" }
  | { kind: "section-heading"; text: string }
  | { kind: "subsection-heading"; text: string }
  | { kind: "text"; text: string };

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function sanitizeTelegramHref(rawHref: string) {
  const href = rawHref.trim();
  if (!href) {
    return null;
  }

  const lowered = href.toLowerCase();
  if (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("tg://") ||
    lowered.startsWith("mailto:")
  ) {
    return escapeHtml(href);
  }

  return null;
}

function splitTrailingUrlPunctuation(rawUrl: string) {
  let core = rawUrl;
  let trailing = "";

  while (/[.,!?;:]$/.test(core)) {
    trailing = core.slice(-1) + trailing;
    core = core.slice(0, -1);
  }

  while (core.endsWith(")")) {
    const openCount = (core.match(/\(/g) ?? []).length;
    const closeCount = (core.match(/\)/g) ?? []).length;
    if (closeCount <= openCount) {
      break;
    }
    trailing = ")" + trailing;
    core = core.slice(0, -1);
  }

  while (core.endsWith("]")) {
    const openCount = (core.match(/\[/g) ?? []).length;
    const closeCount = (core.match(/]/g) ?? []).length;
    if (closeCount <= openCount) {
      break;
    }
    trailing = "]" + trailing;
    core = core.slice(0, -1);
  }

  return { core, trailing };
}

function storeToken(tokens: string[], value: string) {
  const token = `${TOKEN_PREFIX}${tokens.length};\u0000`;
  tokens.push(value);
  return token;
}

function restoreTokens(text: string, tokens: string[]) {
  let restored = text;
  for (let index = 0; index < tokens.length; index += 1) {
    restored = restored.replaceAll(`${TOKEN_PREFIX}${index};\u0000`, tokens[index] ?? "");
  }
  return restored;
}

function applyInlineFormatting(text: string) {
  return text
    .replaceAll(/~~([^~]+)~~/g, "<s>$1</s>")
    .replaceAll(/\*\*([^*\n][\s\S]*?[^*\n])\*\*/g, "<b>$1</b>")
    .replaceAll(/\*([^*\n][\s\S]*?[^*\n])\*/g, "<i>$1</i>");
}

function renderInlineMarkdownToTelegramHtml(text: string) {
  const tokens: string[] = [];
  let working = text;

  working = working.replaceAll(/`([^`\n]+)`/g, (_match, code: string) =>
    storeToken(tokens, `<code>${escapeHtml(code)}</code>`),
  );

  working = working.replaceAll(/\[([^\]]+)\]\(([^)\s]+)\)/g, (match, label: string, href: string) => {
    const safeHref = sanitizeTelegramHref(href);
    if (!safeHref) {
      return match;
    }
    return storeToken(
      tokens,
      `<a href="${safeHref}">${escapeHtml(label)}</a>`,
    );
  });

  working = working.replaceAll(
    /\b(?:https?:\/\/|tg:\/\/|mailto:)[^\s<>"`]+/g,
    (rawUrl: string) => {
      const { core, trailing } = splitTrailingUrlPunctuation(rawUrl);
      const safeHref = sanitizeTelegramHref(core);
      if (!safeHref) {
        return rawUrl;
      }
      return (
        storeToken(tokens, `<a href="${safeHref}">${escapeHtml(core)}</a>`) +
        trailing
      );
    },
  );

  working = escapeHtml(working);
  working = applyInlineFormatting(working);
  return restoreTokens(working, tokens);
}

function renderHeadingLine(level: number, content: string): TelegramRenderedLine {
  const renderedContent = renderInlineMarkdownToTelegramHtml(content);
  if (level <= 2) {
    return {
      kind: "section-heading",
      text: `<b>${renderedContent}</b>`,
    };
  }
  if (level === 3) {
    return {
      kind: "subsection-heading",
      text: `<b>${renderedContent}</b>`,
    };
  }
  return {
    kind: "text",
    text: renderedContent,
  };
}

function renderMarkdownLine(line: string): TelegramRenderedLine {
  if (line.trim().length === 0) {
    return { kind: "blank", text: "" };
  }

  const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
  if (headingMatch) {
    return renderHeadingLine(
      headingMatch[1]?.length ?? 1,
      headingMatch[2] ?? "",
    );
  }

  const bulletMatch = line.match(/^\s*[-*+]\s+(.+)$/);
  if (bulletMatch) {
    return {
      kind: "text",
      text: `• ${renderInlineMarkdownToTelegramHtml(bulletMatch[1] ?? "")}`,
    };
  }

  const orderedMatch = line.match(/^\s*(\d+)\.\s+(.+)$/);
  if (orderedMatch) {
    return {
      kind: "text",
      text: `${orderedMatch[1]}. ${renderInlineMarkdownToTelegramHtml(orderedMatch[2] ?? "")}`,
    };
  }

  const quoteMatch = line.match(/^\s*>\s?(.*)$/);
  if (quoteMatch) {
    return {
      kind: "text",
      text: `&gt; ${renderInlineMarkdownToTelegramHtml(quoteMatch[1] ?? "")}`,
    };
  }

  return {
    kind: "text",
    text: renderInlineMarkdownToTelegramHtml(line),
  };
}

function renderMarkdownTextBlock(text: string) {
  const lines = text.split("\n").map(renderMarkdownLine);
  const rendered: string[] = [];

  const ensureBlankSeparator = () => {
    if (rendered.length === 0 || rendered[rendered.length - 1] === "") {
      return;
    }
    rendered.push("");
  };

  const hasLaterVisibleLine = (startIndex: number) =>
    lines.slice(startIndex + 1).some((line) => line.kind !== "blank");

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    if (line.kind === "blank") {
      ensureBlankSeparator();
      continue;
    }

    if (line.kind === "section-heading") {
      ensureBlankSeparator();
      rendered.push(line.text);
      if (hasLaterVisibleLine(index)) {
        rendered.push("");
      }
      continue;
    }

    if (line.kind === "subsection-heading") {
      rendered.push(line.text);
      continue;
    }

    rendered.push(line.text);
  }

  while (rendered[rendered.length - 1] === "") {
    rendered.pop();
  }

  return rendered.join("\n");
}

function renderCodeFence(language: string, code: string) {
  const trimmedLanguage = language.trim();
  const safeLanguage = /^[a-z0-9_+-]+$/i.test(trimmedLanguage)
    ? trimmedLanguage
    : "";
  const escapedCode = escapeHtml(code.replace(/\n$/, ""));

  if (safeLanguage) {
    return `<pre><code class="language-${safeLanguage}">${escapedCode}</code></pre>`;
  }

  return `<pre><code>${escapedCode}</code></pre>`;
}

export function renderTelegramHtmlSafeFromMarkdown(markdown: string) {
  const normalized = markdown.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
  if (!normalized) {
    return "";
  }

  const segments: string[] = [];
  const codeFencePattern = /```([^\n`]*)\n([\s\S]*?)```/g;
  let cursor = 0;

  for (const match of normalized.matchAll(codeFencePattern)) {
    const matchText = match[0];
    const matchIndex = match.index ?? -1;
    if (matchIndex < 0) {
      continue;
    }

    const textBefore = normalized.slice(cursor, matchIndex);
    if (textBefore) {
      segments.push(renderMarkdownTextBlock(textBefore));
    }

    segments.push(renderCodeFence(match[1] ?? "", match[2] ?? ""));
    cursor = matchIndex + matchText.length;
  }

  const tail = normalized.slice(cursor);
  if (tail) {
    const unmatchedFenceMatch = tail.match(/([\s\S]*?)```([^\n`]*)\n([\s\S]*)$/);
    if (unmatchedFenceMatch) {
      const textBeforeFence = unmatchedFenceMatch[1] ?? "";
      const language = unmatchedFenceMatch[2] ?? "";
      const codeTail = unmatchedFenceMatch[3] ?? "";
      if (textBeforeFence) {
        segments.push(renderMarkdownTextBlock(textBeforeFence));
      }
      segments.push(renderCodeFence(language, codeTail));
    } else {
      segments.push(renderMarkdownTextBlock(tail));
    }
  }

  return segments
    .filter((segment) => segment.length > 0)
    .join("\n")
    .replaceAll(/\n{3,}/g, "\n\n")
    .trim();
}
