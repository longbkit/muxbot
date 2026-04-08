# Observer-Based Session Attach, Detach, And Watch

## Summary

Replace one-request-only run waiting with an observer model so long-running sessions can keep being monitored, later re-attached, or passively watched until real completion.

## Status

Completed

## Why

The current prompt lifecycle is too tied to one inbound message.

That creates the wrong behavior for agentic AI sessions that can run autonomously for a long time:

- a turn can exceed the configured observation window while the agent is still doing useful work
- the original thread should still receive truthful completion when the run actually finishes
- users need a way to re-attach to an active run without dumping full tmux transcript by default
- stale cleanup must not kill a live autonomous run just because no recent chat update was sent

## Scope

- active run lifecycle separate from one request lifecycle
- per-thread observer modes for active runs
- slash commands for attach and detach
- interval-based watch behavior for active runs
- final completion delivery after observation-window detachment
- prompt admission rules that reject overlapping new prompts while a run is still active
- stale cleanup rules that respect active detached runs
- status visibility for active runs in both routed `/status` output and operator `muxbot status`

## Non-Goals

- raw tmux transcript as the default attach response
- operator-only inspect or attach flows from the control system
- ACP or SDK runner implementation in this slice

## Deliverables

- one persisted session runtime state model for idle, running, and detached session runs
- one in-memory active run registry with observer subscription support
- one rule that the runner keeps monitoring after the initial request detaches at the observation window
- one rule that the original thread still gets final settlement when the run really completes
- `/attach` to resume live updates on the current thread
- `/detach` to stop live updates on the current thread while still receiving final settlement
- `/watch every <duration> [for <duration>]` for interval-based updates until completion
- one rule that new prompts are rejected while the session already has an active run
- active-run visibility in routed `/status` output and operator `muxbot status`

## Subtasks

- [x] define persisted session runtime state and invariants
- [x] define observer modes for live, passive-final, and poll behavior
- [x] implement active run monitoring that survives observation-window detachment
- [x] implement final-settlement delivery for detached runs
- [x] implement attach and detach slash commands
- [x] implement watch slash commands
- [x] block new prompt submission while a run is already active
- [x] update stale cleanup to skip active running or detached sessions
- [x] expose active run state in routed `/status` output and operator `muxbot status`
- [x] add automated tests for attach, detach, watch, and final settlement after detachment

## Exit Criteria

- a run that exceeds `maxRuntimeMin` or `maxRuntimeSec` still finishes under runner monitoring
- the original thread receives a truthful final completion when that run later settles
- `/attach` resumes live updates for an already-running session
- `/detach` stops live updates without stopping the underlying run
- `/watch` posts interval snapshots until settlement or watch expiry
- stale cleanup does not kill an active autonomous run only because channel streaming paused
- a second prompt cannot be queued into a session that already has an active run
- routed `/status` and operator `muxbot status` make active detached runs visible without transcript-first inspection

## Related Docs

- [Channels Feature](../features/channels/README.md)
- [Runners Feature](../features/runners/README.md)
- [Configuration Feature](../features/configuration/README.md)
- [Transcript Presentation And Streaming](../architecture/transcript-presentation-and-streaming.md)
- [Runner Interface Standardization And tmux Runner Hardening](features/runners/2026-04-04-runner-interface-standardization-and-tmux-runner-hardening.md)
- [Chat-First Streaming And Transcript Request Commands](features/channels/2026-04-04-chat-first-streaming-and-transcript-request-commands.md)
