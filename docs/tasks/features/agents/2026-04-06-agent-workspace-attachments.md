# Agent Workspace Attachments

## Status

Done

## Priority

P0

## Why

Users need Slack and Telegram file uploads to become usable local files for Codex or Claude.

This MVP stayed intentionally simple:

- save inbound files inside the agent workspace
- mention them as `@/absolute/path`
- append the user message after the file mentions

## Scope

Delivered slice:

- Slack inbound file download
- Telegram inbound document or photo download
- workspace-local storage under `.attachments`
- prompt shaping as `@filepath1 @filepath2 ... <user message>`

Out of scope for this slice:

- outbound file replies
- OCR or PDF extraction
- cross-session dedupe
- retention policy and cleanup
- advanced media support

## Architecture Notes

- channels own provider-specific download logic
- the agents layer owns workspace placement
- runners stay provider-agnostic and only receive local file paths

## What Shipped

- inbound files land under `{workspace}/.attachments/{sessionKey}/{messageId}`
- text-only messages keep current behavior
- file-only messages still produce a usable prompt
- slash commands and bash commands are not broken by attachment prefixing
- failed downloads do not crash normal text handling

## Evidence

- Slack and Telegram attachment download paths are implemented in the channel layer
- workspace-local storage is implemented in the agents layer under `.attachments`
- prompt shaping is implemented as `@/absolute/path` mention prepending
- regression coverage exists for storage, prompt shaping, and Slack attachment hydration

This task should stay closed unless a new follow-up task is opened for outbound files, OCR, richer media handling, retention, or stronger cross-channel coverage.

## Related Docs

- [Agent Workspace Attachments](../../../features/agents/attachments.md)
