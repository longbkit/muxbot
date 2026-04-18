# Claude CLI Profile

## Summary

Claude has the strongest explicit session-identity model of the current launch trio because `clisbot` can pass a known session id at startup.

Its weaker area is the same as Codex: startup readiness is still more heuristic than explicit.

## Capability Mapping

### `start`

Support: `Strong`

Current basis:

- command: `claude`
- startup args include:
  - `--dangerously-skip-permissions`
- trust prompt handling is enabled

### `probe`

Support: `Partial`

Current basis:

- no CLI-specific `startupReadyPattern` is configured
- readiness depends on trust-prompt dismissal plus generic startup bootstrap behavior

Known stabilization already shipped:

- runner now recognizes current Claude trust prompt shapes such as:
  - `Quick safety check:`
  - `Yes, I trust this folder`
  - `Enter to confirm · Esc to cancel`

Current implication:

- startup is meaningfully better than before
- but the compatibility profile should still mark readiness as partial until a dedicated ready pattern exists

### `sessionId`

Support: `Strong`

Current basis:

- create mode: `explicit`
- startup args include `--session-id {sessionId}`
- capture mode: `off`

Current implication:

- Claude does not need post-start status-command capture for continuity in the current model
- the known session id is already owned before startup

### `resume`

Support: `Strong`

Current basis:

- command mode resume
- current resume shape:
  - `claude --resume {sessionId} --dangerously-skip-permissions`

### `recover`

Support: `Strong`

Current basis:

- logical session continuity does not depend on the old tmux process surviving
- stored Claude session id can be reused when a new runner instance is created

### `attach`

Support: `Strong`

Current basis:

- tmux snapshot capture and observer flows already exist
- transcript normalization already recognizes Claude snapshots and running timer lines

### `interrupt`

Support: `Partial`

Current basis:

- current interrupt path sends `Escape`
- current normalization recognizes Claude running clues such as:
  - `Worked for ...`
  - footer rows that include `| claude | ... | <duration>`

Current implication:

- runtime UX can observe Claude as running
- interrupt confirmation is still indirect, so the compatibility profile should keep it best-effort

## Running Snapshot Signals

Current normalized running clues include:

- `Worked for ...`
- `Cooked for ...`
- Claude footer duration rows

The running snapshot layer can keep these, but final contract truth should still come from normalized state rather than raw footer matching.

## Main Drift Risks

- no explicit startup ready pattern
- Claude trust/safety prompt wording can drift again
- multiline paste and terminal settlement remain sensitive to CLI UI changes
