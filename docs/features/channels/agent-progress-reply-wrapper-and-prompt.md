# Agent Progress Reply Wrapper And Prompt

## Summary

This feature gives coding agents a stable way to send user-facing progress and final replies back through `muxbot` while they are running inside another workspace.

The feature combines three pieces:

- a stable local `muxbot` wrapper under `~/.muxbot/bin/muxbot`
- agent runner launch behavior that exposes that wrapper consistently
- a channel-owned prompt envelope that tells the agent exactly how to send progress updates back to the current Slack or Telegram surface
- a response-mode policy layer that can disable normal channel auto-settlement while keeping runner observation active

## Scope

- auto-create a stable local `muxbot` wrapper for dev and local runtime use
- expose the wrapper to agent runner sessions
- inject a short channel context and reply command into the agent-bound prompt
- support `responseMode: "message-tool"` so progress and final replies come from `muxbot message send`, not from pane settlement
- resolve reply delivery in this order: surface override, agent override, provider default
- keep slash commands and privilege commands unaffected
- make the flow easy to test on a fresh machine with `bun start`

## Invariants

- channels own the prompt-envelope text because the envelope is surface context
- channels still observe runner state even when `responseMode` is `message-tool`
- runners own wrapper availability inside agent processes
- the prompt envelope only affects agent-bound prompts, not channel control commands
- the wrapper must be stable across workspaces on the same machine

## Dependencies

- [Channels](README.md)
- [Runners](../runners/README.md)
- [Configuration](../configuration/README.md)
- [docs/tasks/features/channels](../../tasks/features/channels)
