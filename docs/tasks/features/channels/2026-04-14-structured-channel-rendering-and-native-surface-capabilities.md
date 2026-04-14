# Structured Channel Rendering And Native Surface Capabilities

## Summary

Implement a first-class channel-rendering layer for Slack and Telegram so `clisbot` can use native structured output, native reply behavior, and single-message preview updates instead of treating both channels as mostly plain-text sinks.

## Status

Ready

## Outcome

After this task:

- Slack can send structured replies with fallback text
- Telegram can send safely formatted HTML with plain-text fallback
- both channels can stream by editing one preview reply where supported
- buttons, menus, and reply-target behavior are modeled as explicit channel capabilities
- status and debug output tell the operator which rendering path actually won

## Scope

- add a shared render-intent model for channel replies
- implement Slack structured rendering primitives
- implement Telegram structured rendering primitives
- add preview-edit delivery for Slack and Telegram
- add explicit reply-target resolution per channel
- add capability-aware status reporting
- update docs and tests

## Non-Goals

- inventing a universal block schema for all channels
- covering every advanced Slack modal or Telegram media flow in phase 1
- replacing prompt-template configuration
- moving provider-owned transport details out of channel adapters

## Research

- [OpenClaw Structured Channel Rendering Techniques For Slack And Telegram](../../../research/channels/2026-04-14-openclaw-structured-channel-rendering-techniques.md)
- [Feature Doc](../../../features/channels/structured-channel-rendering-and-native-surface-capabilities.md)

## Product Decisions To Implement

- structured rendering is broader than text templating
- shared logic should resolve intent, but channels own final rendering
- fallback behavior is part of the contract, not an error path afterthought
- status and debug UX must expose the winning renderer and fallback path
- capability flags should be explicit enough that product and tech leads can review them without reading code first

## Config Shape Direction

Recommended shape:

```json
{
  "channels": {
    "slack": {
      "rendering": {
        "structuredReplies": true,
        "previewEdits": true,
        "processingFeedback": {
          "ackReaction": true,
          "threadStatus": true
        }
      }
    },
    "telegram": {
      "rendering": {
        "textMode": "html",
        "previewEdits": true,
        "inlineButtons": "allowlist",
        "nativeCommandMenu": true
      }
    }
  }
}
```

The exact config names can still change, but the model should stay explicit and channel-owned.

## Implementation Slices

### 1. Shared rendering contract

- define reply render intent and fallback outcome types
- define preview-edit capability checks
- define reply-target intent separate from final provider payload

### 2. Slack rendering primitives

- add Block Kit send path with fallback text
- keep structured output validation near the Slack adapter
- surface native processing feedback and structured action affordances

### 3. Telegram rendering primitives

- add safe HTML formatting path
- retry as plain text on parse failure
- support inline keyboards and native command-menu ownership where applicable

### 4. Draft preview edits

- send one preview message and edit it while work is active
- fall back cleanly when edit semantics are unavailable or unsafe
- keep final settlement truthful

### 5. Reply-target and thread behavior

- make current-message reply, explicit reply-to, and thread or topic targeting explicit
- keep Slack and Telegram semantics separate where the platform differs

### 6. Status, docs, and tests

- show winning renderer, preview-edit state, reply-target mode, and fallback usage
- document capability differences clearly
- add channel-specific regression coverage

## Validation Notes

- Slack tests:
  - structured replies validate or reject invalid blocks correctly
  - fallback text exists for structured output
  - preview edit updates a single visible reply
- Telegram tests:
  - markdown-ish output becomes Telegram-safe HTML
  - parse failure retries as plain text
  - inline keyboard rendering respects capability rules
  - preview edit updates a single visible reply
- cross-channel tests:
  - reply-target intent resolves per channel correctly
  - status truthfully reports renderer and fallback path
  - unsupported capabilities fail with clear operator-facing diagnostics

## Exit Criteria

- `clisbot` has a reviewable render model for Slack and Telegram
- structured output paths are explicit, not hidden inside ad hoc send logic
- fallback behavior is documented and tested
- preview-edit streaming works without noisy multi-message spam on supported channels
- product and tech leads can inspect docs and status output to understand active behavior quickly
