import { stripVTControlCharacters } from "node:util";

export function normalizePaneText(raw: string): string {
  return stripVTControlCharacters(raw).replaceAll("\r\n", "\n").replaceAll("\r", "\n").trimEnd();
}

export function splitNormalizedLines(raw: string): string[] {
  const normalized = normalizePaneText(raw);
  return normalized ? normalized.split("\n") : [];
}

export function trimBlankLines(lines: string[]) {
  let start = 0;
  let end = lines.length;

  while (start < end && !lines[start]?.trim()) {
    start += 1;
  }

  while (end > start && !lines[end - 1]?.trim()) {
    end -= 1;
  }

  return lines.slice(start, end);
}

export function collapseBlankLines(lines: string[]) {
  const collapsed: string[] = [];

  for (const line of lines) {
    if (!line.trim() && collapsed.at(-1) === "") {
      continue;
    }

    collapsed.push(line.trim() ? line : "");
  }

  return collapsed;
}

function looksLikeUrlContinuation(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith("(") || trimmed.startsWith("http://") || trimmed.startsWith("https://");
}

function isListOrStructuredLine(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("```") ||
    trimmed.startsWith("› ") ||
    /^[-*•]\s/.test(trimmed) ||
    /^\d+\.\s/.test(trimmed) ||
    trimmed.startsWith("#")
  );
}

function shouldJoinWrappedLine(previousLine: string, currentLine: string) {
  const previous = previousLine.trimEnd();
  const current = currentLine.trim();
  if (!previous || !current) {
    return false;
  }

  if (isListOrStructuredLine(currentLine)) {
    return false;
  }

  return (
    /^\s{2,}/.test(currentLine) ||
    previous.endsWith("-") ||
    current.startsWith("(") ||
    current.startsWith("http")
  );
}

function joinWrappedLines(previousLine: string, currentLine: string) {
  const previous = previousLine.trimEnd();
  const current = currentLine.trim();
  if (previous.endsWith("-")) {
    return `${previous}${current}`;
  }

  return `${previous} ${current}`;
}

function stripUrlContinuationGaps(lines: string[]) {
  const compacted: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      const previousLine = compacted.at(-1);
      const nextLine = lines[index + 1];
      if (previousLine && nextLine && looksLikeUrlContinuation(nextLine)) {
        continue;
      }
    }

    compacted.push(line);
  }

  return compacted;
}

function unwrapSoftWrappedLines(lines: string[]) {
  const unwrapped: string[] = [];

  for (const line of stripUrlContinuationGaps(lines)) {
    const previousLine = unwrapped.at(-1);
    if (previousLine && shouldJoinWrappedLine(previousLine, line)) {
      unwrapped[unwrapped.length - 1] = joinWrappedLines(previousLine, line);
      continue;
    }

    unwrapped.push(line);
  }

  return unwrapped;
}

export function looksLikeCodexSnapshot(lines: string[]) {
  return lines.some((line) => {
    const trimmed = line.trim();
    return (
      trimmed.includes("OpenAI Codex") ||
      trimmed.includes("Welcome to Codex") ||
      trimmed.includes("Do you trust the contents of this directory?") ||
      trimmed.startsWith("› ") ||
      /^gpt-[\w.-]+/.test(trimmed)
    );
  });
}

export function looksLikeClaudeSnapshot(lines: string[]) {
  return lines.some((line) => {
    const trimmed = line.trim();
    return (
      trimmed.includes("Claude Code v") ||
      trimmed.includes("Welcome back!") ||
      trimmed.includes("Tips for getting started") ||
      trimmed.startsWith("❯") ||
      trimmed.startsWith("⏺")
    );
  });
}

export function isProgressLine(line: string) {
  const trimmed = line.trim();
  const normalized = trimmed.replace(/^(?::eight_spoked_asterisk:|[✽✶])\s+/, "");
  return (
    /^• (Searching|Searched|Explored|Reading|Inspecting|Checking|Running|Calling|Using|Thinking|Looking|Analyzing|Listing|Gathering)\b/i.test(
      normalized,
    ) ||
    /^• I(?:'|’)m (checking|listing|searching|looking|inspecting|reading|running|analyzing|pulling|refreshing)\b/i.test(
      normalized,
    ) ||
    /^[^A-Za-z0-9]*[A-Za-z][a-z]{3,24}(?:ing|ed)$/i.test(normalized) ||
    /^Read \d+ files?(?:, recalled \d+ memor(?:y|ies))?(?: \(.*\))?$/i.test(normalized) ||
    /^Reading \d+ files?(?: \(.*\))?$/i.test(normalized) ||
    /^Searched for \d+ patterns?(?:, read \d+ files?)?(?: \(.*\))?$/i.test(normalized) ||
    /^Searching for \d+ patterns?, reading \d+ files?[.…]*(?: \(.*\))?$/i.test(normalized)
  );
}

function unwrapMessageBlocks(
  lines: string[],
  params: {
    marker: RegExp;
    isProgressLine?: (line: string) => boolean;
  },
) {
  const normalized: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!params.marker.test(line.trimStart()) || params.isProgressLine?.(line)) {
      normalized.push(line);
      continue;
    }

    let end = index + 1;
    let sawIndentedContinuation = false;
    while (end < lines.length) {
      const candidate = lines[end] ?? "";
      if (!candidate.trim()) {
        end += 1;
        continue;
      }

      if (/^\s{2,}\S/.test(candidate)) {
        sawIndentedContinuation = true;
        end += 1;
        continue;
      }

      break;
    }

    if (!sawIndentedContinuation) {
      normalized.push(line);
      continue;
    }

    normalized.push(line.replace(params.marker, ""));
    for (let continuationIndex = index + 1; continuationIndex < end; continuationIndex += 1) {
      const continuation = lines[continuationIndex] ?? "";
      normalized.push(continuation ? continuation.replace(/^ {2}/, "") : continuation);
    }
    index = end - 1;
  }

  return normalized;
}

function unwrapCodexMessageBlocks(lines: string[]) {
  return unwrapMessageBlocks(lines, {
    marker: /^\s*•\s*/,
    isProgressLine,
  });
}

function unwrapClaudeMessageBlocks(lines: string[]) {
  return unwrapMessageBlocks(lines, {
    marker: /^\s*⏺\s*/,
  }).map((line) =>
    line
      .replace(/^\s*⏺\s*/, "")
      .replace(/^\s*⎿\s*/, "")
      .replace(/^\s*·\s*/, "• "),
  );
}

function dropPromptBlocks(lines: string[], marker: RegExp) {
  const filtered: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!marker.test(line.trimStart())) {
      filtered.push(line);
      continue;
    }

    let end = index + 1;
    while (end < lines.length) {
      const candidate = lines[end] ?? "";
      if (!candidate.trim()) {
        end += 1;
        continue;
      }

      if (/^\s{2,}\S/.test(candidate)) {
        end += 1;
        continue;
      }

      break;
    }

    index = end - 1;
  }

  return filtered;
}

function dropCodexPromptBlocks(lines: string[]) {
  return dropPromptBlocks(lines, /^\s*›\s/);
}

function dropClaudePromptBlocks(lines: string[]) {
  const filtered: string[] = [];
  let skippingPrompt = false;

  for (const line of lines) {
    if (/^\s*❯/.test(line.trimStart())) {
      skippingPrompt = true;
      continue;
    }

    if (skippingPrompt) {
      if (!line.trim()) {
        skippingPrompt = false;
      }
      continue;
    }

    filtered.push(line);
  }

  return filtered;
}

function isInterruptStatusLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return (
    /^(?:[•◦·]\s*)?Working(?:\s*\()?\d+s\b.*(?:esc to interrupt|interrupt)\)?$/i.test(trimmed) ||
    /^(?:[•◦·]\s*)?\d+s\s*[•◦·]?\s*esc to interrupt\)?$/i.test(trimmed)
  );
}

function shouldDropCodexChromeLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.includes("Welcome to Codex") ||
    trimmed.includes("Do you trust the contents of this directory?") ||
    trimmed === "Press enter to continue" ||
    trimmed === "1. Yes, continue" ||
    trimmed === "2. No, quit" ||
    trimmed.startsWith("model:") ||
    trimmed.startsWith("directory:") ||
    trimmed.startsWith("Tip:") ||
    trimmed.startsWith("Ctrl+L is disabled") ||
    isInterruptStatusLine(trimmed) ||
    trimmed.startsWith("› ") ||
    /^gpt-[\w.-]+ .*·/.test(trimmed) ||
    /^[╭╰│]/.test(trimmed) ||
    /^─+$/.test(trimmed)
  );
}

function shouldDropClaudeChromeLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) {
    return false;
  }

  return (
    trimmed.includes("Claude Code v") ||
    trimmed.includes("Welcome back!") ||
    trimmed.includes("Tips for getting started") ||
    trimmed.includes("Ask Claude to create a new app or clone a repository") ||
    trimmed.includes("Recent activity") ||
    trimmed.includes("No recent activity") ||
    trimmed.includes("API Usage Billing") ||
    trimmed.includes("shift+tab to cycle") ||
    trimmed.includes("ctrl+o to expand") ||
    trimmed.includes("ctrl+b ctrl+b") ||
    trimmed.includes("run in background") ||
    /^~\/\.muxbot\/(?:workspace\/)?[a-z0-9._/-]+$/i.test(trimmed) ||
    trimmed.includes("| claude |") ||
    /^(?:[✻*]\s*)?(?:Worked|Cooked) for \d+s$/i.test(trimmed) ||
    trimmed.startsWith("⏵⏵") ||
    trimmed.startsWith("❯") ||
    isProgressLine(trimmed) ||
    /^[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+$/.test(trimmed) ||
    /^[╭╰│]/.test(trimmed) ||
    /^─+$/.test(trimmed) ||
    /^[▐▛▜▌▝▘ ]+$/.test(trimmed) ||
    /^[▐▛▜▌▝▘ ]+.+$/.test(trimmed)
  );
}

function normalizeBoundaryLine(line: string) {
  return line.trim().replace(/^(?::eight_spoked_asterisk:|[-*•◦·✽✶])\s+/, "");
}

export function collapseAdjacentDuplicateLines(raw: string) {
  const lines = raw.split("\n");
  const collapsed: string[] = [];
  let lastNonEmptyNormalized = "";

  for (const line of lines) {
    const normalized = normalizeBoundaryLine(line);
    if (normalized && normalized === lastNonEmptyNormalized) {
      if (collapsed.at(-1) === "") {
        collapsed.pop();
      }
      continue;
    }

    collapsed.push(line);
    if (normalized) {
      lastNonEmptyNormalized = normalized;
    }
  }

  return collapseBlankLines(collapsed).join("\n").trim();
}

export function cleanInteractionSnapshot(raw: string) {
  const lines = splitNormalizedLines(raw);
  const isCodex = looksLikeCodexSnapshot(lines);
  const isClaude = looksLikeClaudeSnapshot(lines);
  const promptStripped = isCodex
    ? dropCodexPromptBlocks(lines)
    : isClaude
      ? dropClaudePromptBlocks(lines)
      : lines;
  const filtered = promptStripped.filter((line) => {
    if (isCodex && shouldDropCodexChromeLine(line)) {
      return false;
    }

    if (isClaude && shouldDropClaudeChromeLine(line)) {
      return false;
    }

    return true;
  });
  const normalized = isCodex
    ? unwrapCodexMessageBlocks(filtered)
    : isClaude
      ? unwrapClaudeMessageBlocks(filtered)
      : filtered;
  const unwrapped = unwrapSoftWrappedLines(normalized);
  return collapseAdjacentDuplicateLines(collapseBlankLines(trimBlankLines(unwrapped)).join("\n"));
}
