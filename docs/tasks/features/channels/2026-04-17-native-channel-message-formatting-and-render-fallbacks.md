# Native Channel Message Formatting And Render Fallbacks

## Status

Done

## Summary

Improve `clisbot` reply readability by making channel output feel native to each surface instead of looking like plain text pasted into Slack or Telegram.

Current shipped result:

- the current message command surface now uses `--body-file` as the preferred file-backed body option, with `--message-file` kept only as a compatibility alias
- bot-facing guidance still prefers `--message` with inline text or heredoc bodies instead of file-backed payloads
- `clisbot message send` and `clisbot message edit` now have an explicit native render contract
- Markdown-like input can already be rendered natively per channel in the current phase
- future fallback expansion can return as a separate follow-up if product needs change

## Why This Task Exists

Readable output quality is a major part of whether the bot feels genuinely useful at work.

This task existed to lock the current contract:

- what `--input` means
- what `--render` means
- how Slack and Telegram each receive native readable output
- which native paths are explicit versus channel-owned

Without this, the system risked an awkward middle state where:

- prompts become bloated with formatting instructions
- weak models still produce ugly output
- transport logic stays too plain-text oriented
- operators cannot tell which formatting path actually won

## Product Goal

For each channel, make the default visible reply as native, readable, and low-friction as possible.

Current product shape:

- Telegram should prefer safe readable HTML when possible
- Slack should support native readable rendering, including explicit Block Kit when requested
- plain text should not be the default mental model for normal operator use

## Scope

- define the message-formatting contract for channel replies
- define how `message` command rendering participates in that contract
- define explicit native paths versus channel-owned native rendering
- keep operator-visible behavior short, predictable, and reviewable

## Non-Goals

- solving every advanced channel widget in phase 1
- inventing a universal rich-text format for all providers
- continuing broader fallback experimentation before it is needed again

## Channel-Specific Direction

### Telegram

- current preferred path: Markdown-like input resolves into Telegram-safe HTML
- direct native path: pre-rendered HTML can pass through explicitly

### Slack

- current preferred path: Markdown-like input resolves into Slack-native readable output
- explicit structured path: Block Kit can be sent directly or requested explicitly

## What Shipped

- `--input md --render native` is now the default contract
- Telegram native delivery supports safe HTML output for Markdown-like input
- Slack native delivery supports readable native formatting and explicit Block Kit paths
- raw native payloads remain available through explicit input and render combinations
- help text, feature docs, and message CLI behavior are aligned around the same contract

## Follow-Up Boundary

- do not keep this task open just to speculate about more fallback paths
- if future product direction needs richer renderer fallback logic, reopen it as a new follow-up task with a narrower concrete contract

## Exit Criteria

- a reviewer can explain the native render contract clearly
- Slack and Telegram each have a preferred native formatting strategy
- operators can use the surface without treating plain text as the main delivery contract

## Related Docs

- [Message Command Formatting And Render Modes](../../../features/channels/message-command-formatting-and-render-modes.md)
- [Structured Channel Rendering And Native Surface Capabilities](2026-04-14-structured-channel-rendering-and-native-surface-capabilities.md)
- [docs/features/channels/README.md](../../../features/channels/README.md)
- [docs/features/non-functionals/stability/README.md](../../../features/non-functionals/stability/README.md)
