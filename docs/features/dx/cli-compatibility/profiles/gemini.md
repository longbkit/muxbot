# Gemini CLI Profile

## Summary

Gemini currently has the clearest explicit startup contract of the launch trio.

Its biggest weakness is not session continuity.

Its biggest weakness is environment and auth gating.

## Capability Mapping

### `start`

Support: `Strong`

Current basis:

- command: `gemini`
- startup args include:
  - `--approval-mode=yolo`
  - `--sandbox=false`
- trust prompt handling is enabled
- explicit startup blockers are configured

### `probe`

Support: `Strong`

Current basis:

- explicit ready pattern:
  - `Type your message or @path/to/file`
- explicit startup blockers are configured for OAuth and sign-in recovery flows

Current implication:

- Gemini is the current strongest example of what a hardened readiness contract should look like
- `probe` can truthfully distinguish `ready` from auth-blocked startup much better than the Codex and Claude paths

### `sessionId`

Support: `Strong`

Current basis:

- create mode: `runner`
- capture mode: `status-command`
- status command: `/stats session`
- capture pattern: UUID-like session id

### `resume`

Support: `Strong`

Current basis:

- command mode resume
- current resume shape:
  - `gemini --resume {sessionId} --approval-mode=yolo --sandbox=false`

### `recover`

Support: `Strong`

Current basis:

- `agents` persists `sessionKey -> sessionId`
- runner can recreate tmux and reuse Gemini session id with `--resume`

### `attach`

Support: `Strong`

Current basis:

- tmux snapshot capture and observer flows already exist
- transcript normalization already recognizes Gemini snapshots and current running timer line

### `interrupt`

Support: `Partial`

Current basis:

- current interrupt path sends `Escape`
- current normalization recognizes Gemini running clue:
  - `Thinking... (esc to cancel, <duration>)`

Current implication:

- running-state observation is reasonably explicit
- interrupt confirmation is still best-effort until a stronger CLI confirmation path exists

## Running Snapshot Signals

Current normalized running clue:

- `Thinking... (esc to cancel, <duration>)`

This timer line is important in running snapshots and should be preserved there.

## Main Drift Risks

- upstream auth/setup screens may drift
- ready pattern or `/stats session` output may drift
- Gemini routed message-tool behavior is still weaker than desired for some live channel flows

## Operator Caveat

Gemini support is real, but it depends on usable auth in the runtime environment.

If Gemini falls into OAuth or sign-in setup flow, the correct compatibility state is `blocked`, not `ready`.
