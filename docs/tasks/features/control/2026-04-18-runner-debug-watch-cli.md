# Runner Debug Watch CLI

## Summary

Add a first-class operator CLI for fast tmux-session selection and pane watching, with explicit `latest admitted turn` and `next admitted turn` semantics.

## Status

Done

## Why

Raw tmux inspection works, but it is too slow and too implicit for common failure modes:

- the first inbound message can fail before an operator manually lists sessions
- an existing logical session can fail on a later message even though the tmux session name is stable
- operators need a shortcut that selects the right tmux pane by message-flow truth, not by tmux create time

## Scope

- `clisbot runner list`
- `clisbot runner inspect <session-name>`
- `clisbot runner watch <session-name>`
- `clisbot runner watch --latest`
- `clisbot runner watch --next`
- configurable `--lines`, `--interval`, and watch timeout
- persisted `lastAdmittedPromptAt` metadata for fast latest or next selection

## Non-Goals

- operator interactive attach
- chat-surface `/attach` or `/watch` redesign
- replacing raw tmux commands for every low-level operation

## Exit Criteria

- operators can discover active tmux sessions without remembering raw socket commands
- `watch --latest` chooses the session that most recently admitted a new prompt
- `watch --next` can be started before sending a test message and auto-selects the first newly admitted prompt
- docs, tests, and user guide all describe the same semantics

## Outcome

Shipped:

- new runner control commands under `clisbot runner`
- `lastAdmittedPromptAt` persisted per session entry
- integration coverage with real tmux sessions for `list`, `inspect`, `watch --latest`, and `watch --next`
- synced operator docs and runtime guide wording
