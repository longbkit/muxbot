# Real-CLI Smoke Surface And Launch-Trio Compatibility Summary

## Summary

Add a real-CLI smoke surface that can run a small scenario suite against Codex, Claude, and Gemini, save artifacts, classify failures, and output a CLI-by-CLI compatibility summary.

## Status

Done

## Why

The repository now has:

- a DX front door
- a capability contract
- CLI profiles

The next missing piece is practical evidence.

The operator needs a way to validate real upstream CLIs directly and quickly, without first wiring a full fake CLI harness.

## Scope

- add an operator-facing real-CLI smoke command shape
- define a small launch-trio scenario suite
- store artifacts for each run
- classify failures into stable categories
- output a roll-up compatibility summary for Codex, Claude, and Gemini

## Proposed First Scenarios

- `startup_ready`
- `first_prompt_roundtrip`
- `session_id_roundtrip`
- `interrupt_during_run`
- `recover_after_runner_loss`

## Minimum Deliverables For The Next Batch

- one smoke command for a single CLI and scenario
- one `--cli all --suite launch-trio` roll-up mode
- one artifact directory per run
- one JSON result object per run
- one summary view that grades each CLI by capability strength

## Exit Criteria

- an operator can run real validation against Codex, Claude, and Gemini without reading raw tmux panes first
- failures are classified into a short stable taxonomy
- artifact paths are included in results
- the output makes it obvious whether a problem is startup, submit, continuity, interrupt, or recovery

## Related Docs

- [Real-CLI Smoke Surface](../../../features/dx/cli-compatibility/real-cli-smoke-surface.md)
- [Capability Contract](../../../features/dx/cli-compatibility/capability-contract.md)
- [CLI Profiles](../../../features/dx/cli-compatibility/backend-profiles.md)

## Outcome

The real-CLI smoke design is now documented with:

- the first scenario set
- the artifact bundle shape
- the failure classification taxonomy
- the launch-trio roll-up questions and suggested implementation order
