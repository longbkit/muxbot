# CLI Compatibility Contract And DX Surface

## Summary

Create a first-class DX feature area for CLI compatibility, then define the v0 machine-readable capability contract that future automation, fake CLI regression, and real-CLI canaries will build on.

## Status

Done

## Why

Right now the repo has real runner behavior and many CLI-specific lessons, but no single front door for:

- what a CLI must support
- which parts are hard requirements versus best-effort
- which machine-readable inputs and outputs automation may rely on
- how pane loss, delayed session ids, and running-state drift should be normalized

Without that contract, new tooling risks being tied too tightly to raw pane text and current tmux quirks.

## Scope

- create `docs/features/dx/`
- create `docs/features/dx/cli-compatibility/`
- define the v0 capability set and normalized state vocabulary
- define input and output envelopes for:
  - `start`
  - `probe`
  - `send`
  - `attach`
  - `resume`
  - `recover`
  - `interrupt`
- define how `runner ... --json` should map onto that contract

## Non-Goals

- implementing the JSON surfaces yet
- replacing the current runner interface in one batch
- hardcoding exact pane-text grammars into the public contract

## Exit Criteria

- `dx` exists as a first-class feature area in docs
- `cli-compatibility` has a stable front door
- capability inputs and outputs are explicit enough for implementation planning
- session id capture, ready detection, pane-loss recovery, and interrupt semantics have named invariants

## Follow-On Work

- map Codex, Claude, and Gemini into CLI profiles against this contract
- implement `runner probe --json`, `runner send --json`, and `runner attach --json`
- add a deterministic fake CLI harness
- add real-CLI canary artifacts and drift classification

## Outcome

The DX feature area and first CLI compatibility slice are now documented under:

- `docs/features/dx/cli-compatibility/backend-profiles.md`
- `docs/features/dx/cli-compatibility/profiles/codex.md`
- `docs/features/dx/cli-compatibility/profiles/claude.md`
- `docs/features/dx/cli-compatibility/profiles/gemini.md`

The v0 capability contract also now names:

- the normalized state vocabulary
- the common response envelope
- the capability set from `start` through `interrupt`
- the recommended future `runner ... --json` mapping
