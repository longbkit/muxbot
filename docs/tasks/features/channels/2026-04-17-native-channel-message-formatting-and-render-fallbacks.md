# Native Channel Message Formatting And Render Fallbacks

## Summary

Improve `clisbot` reply readability by making channel output feel native to each surface instead of looking like plain text pasted into Slack or Telegram.

Shipped follow-up note:

- the current message command surface now uses `--body-file` as the preferred file-backed body option, with `--message-file` kept only as a compatibility alias
- bot-facing guidance still prefers `--message` with inline text or heredoc bodies instead of file-backed payloads

This task focuses on two complementary paths:

1. AI passes a channel-native safe format directly when the model is good enough
2. `clisbot` falls back to channel-native rendering from simpler Markdown-like output when the model is weaker

## Why This Task Exists

Readable output quality is a major part of whether the bot feels genuinely useful at work.

Right now, the product direction already includes structured channel rendering, but this specific product question needs its own contract:

- when should the AI return channel-native formatting directly
- when should the transport layer or message command renderer transform simpler output
- how should Slack and Telegram each get the best readable result

Without this, the system risks falling into an awkward middle state where:

- prompts become bloated with formatting instructions
- weak models still produce ugly output
- transport logic stays too plain-text oriented
- operators cannot tell which formatting path actually won

## Product Goal

For each channel, make the default visible reply as native, readable, and low-friction as possible.

Examples:

- Telegram should prefer safe readable HTML when possible
- Slack should prefer Block Kit or other native structured formatting where it materially improves readability
- plain text should remain a truthful fallback, not the aspirational default for every surface

## Scope

- define the message-formatting contract for channel replies
- define the dual rendering path:
  - AI-native formatted output
  - fallback rendering from simpler Markdown-like output
- define how `message` command rendering participates in that contract
- define operator-visible status for the winning render path
- define safe fallback rules per channel when parsing or conversion fails

## Non-Goals

- solving every advanced channel widget in phase 1
- inventing a universal rich-text format for all providers
- hiding failed rendering behind silent transport magic

## Channel-Specific Direction

### Telegram

- preferred high-quality path: AI returns Telegram-safe HTML or a render intent that resolves to safe HTML
- fallback path: AI returns Markdown-ish text and the renderer converts it into Telegram-safe HTML where possible
- final fallback: plain text if HTML conversion or send validation fails

### Slack

- preferred high-quality path: AI returns an explicit structured render intent or Slack-native formatting contract
- fallback path: AI returns Markdown-ish text and the renderer maps it into a Slack-friendly structured or text presentation
- final fallback: plain text with good spacing and readability if richer rendering is unsafe or unsupported

## Review Questions

1. What is the minimal output contract the AI should target by default?
2. Which models are trusted to emit channel-native safe formatting directly?
3. Should the message command layer accept explicit render modes such as `html_safe` or `slack_blocks`?
4. What is the canonical fallback format: plain text, Markdown-ish text, or a small internal render intent?
5. How should status or logs report whether the final output came from direct AI formatting or renderer fallback?

## Proposed Direction

- keep prompts smaller by not forcing every model to emit perfect native channel formatting
- let stronger models opt into richer explicit output contracts
- let weaker models emit simpler Markdown-like structure
- make the renderer own safe channel-native fallback conversion
- keep the winning render path explicit in status or debug output

## Initial Subtasks

- [ ] define the minimal reply-format contract for AI output
- [ ] define explicit render modes for high-quality model-directed output
- [ ] define fallback conversion rules from Markdown-like output to Telegram-safe HTML
- [ ] define fallback conversion rules from Markdown-like output to Slack-friendly structured output
- [ ] define message-command rendering ownership and status reporting
- [ ] split implementation into narrow channel-specific slices

## Exit Criteria

- a reviewer can explain the direct-format path versus fallback-render path clearly
- Slack and Telegram each have a preferred native formatting strategy
- weaker models no longer force the product into ugly plain-text replies by default
- the winning render path is observable rather than implicit

## Related Docs

- [Message Command Formatting And Render Modes](../../../features/channels/message-command-formatting-and-render-modes.md)
- [Structured Channel Rendering And Native Surface Capabilities](2026-04-14-structured-channel-rendering-and-native-surface-capabilities.md)
- [docs/features/channels/README.md](../../../features/channels/README.md)
- [docs/features/non-functionals/stability/README.md](../../../features/non-functionals/stability/README.md)
