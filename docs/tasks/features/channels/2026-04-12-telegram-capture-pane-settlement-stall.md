# Telegram Capture-Pane Settlement Stall

## Summary

Investigate and fix cases where a Telegram topic is switched to `/responsemode capture-pane`, the bot may show typing, but no visible reply or settlement ever appears.

## Status

Planned

## Why

`capture-pane` is supposed to let `clisbot` deliver pane-derived progress and final settlement without requiring the agent to reply through `clisbot message send`.

If Telegram enters a state where typing appears but no user-visible update ever arrives, the routed conversation becomes ambiguous:

- the human cannot tell whether the prompt was accepted
- the runner may be working while Telegram settlement is stuck
- the route-specific response mode looks broken even though the rest of the system may still be alive

This must be treated as a truthful delivery bug, not just a UX polish issue.

## Scope

- reproduce the failure on a real Telegram topic after switching the route to `responseMode: "capture-pane"`
- trace whether the stuck behavior comes from:
  - missing pane-derived delta detection
  - Telegram live-edit or final-send settlement logic
  - interaction between typing heartbeat and capture-pane delivery
  - route-policy or response-mode precedence resolving differently than expected
- verify whether the runner actually produced meaningful output while Telegram stayed silent
- fix the failure without regressing `message-tool` mode or Slack capture-pane behavior
- add regression coverage for Telegram capture-pane settlement

## Current Truth

- `message-tool` is the default shipped response mode for Slack and Telegram
- operator controls and slash commands already allow switching a route to `capture-pane`
- there is now a real user report that in Telegram topics, `capture-pane` can show typing but then produce no visible response

## Non-Goals

- removing `capture-pane` support
- switching everything back to `message-tool` instead of fixing the broken path
- redesigning the full runner streaming contract in this slice

## Subtasks

- [ ] capture a concrete Telegram topic reproduction with route config and runtime logs
- [ ] trace resolved `responseMode` and settlement path for the affected topic
- [ ] verify whether pane deltas existed during the silent Telegram run
- [ ] verify whether typing heartbeat can outlive or mask a failed settlement path
- [ ] fix Telegram capture-pane settlement so visible progress or final reply appears truthfully
- [ ] add regression tests for Telegram topic capture-pane behavior

## Exit Criteria

- Telegram topic routes using `capture-pane` produce visible progress or final settlement under the reproduced failure case
- typing alone is no longer the only visible signal when pane-derived output exists
- `message-tool` behavior remains intact

## Related Docs

- [Channels Feature](../../../features/channels/README.md)
- [Telegram Topics Channel MVP](2026-04-05-telegram-topics-channel-mvp.md)
- [Agent Progress Reply Wrapper And Prompt](2026-04-09-agent-progress-reply-wrapper-and-prompt.md)
- [Runner Interface Standardization And tmux Runner Hardening](../runners/2026-04-04-runner-interface-standardization-and-tmux-runner-hardening.md)
