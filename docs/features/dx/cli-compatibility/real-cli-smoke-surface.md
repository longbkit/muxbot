# Real-CLI Smoke Surface

## Summary

This page defines the next practical DX batch for real CLI validation.

The goal is simple:

after the next batch, an operator should be able to run a small set of real-CLI checks against Codex, Claude, and Gemini, then immediately read:

- how compatible each CLI currently is
- which capability failed
- whether the failure is startup, session, observation, interrupt, or recovery
- which artifact proves that result

This surface should be driven by the operator risk slices in [Operator Validation Map](./operator-validation-map.md), not by scenario naming alone.

## What The Next Batch Should Deliver

The next batch should give three concrete operator outputs.

### 1. One-shot real-CLI smoke command

Proposed surface:

```text
clisbot runner smoke --cli <codex|claude|gemini> --scenario <name> --json
```

Purpose:

- run one scenario against the real upstream CLI
- return one normalized result object
- avoid forcing the operator to manually inspect raw tmux panes first

It should also preserve enough timing and artifact detail that the operator can still inspect the live truth when needed.

### 2. Artifact bundle per run

Every smoke run should save a small artifact directory:

```text
~/.clisbot/artifacts/runner-smoke/<timestamp>-<cli>-<scenario>/
```

Minimum files:

- `result.json`
- `summary.md`
- `transitions.json`
- `snapshots/000-start.txt`
- `snapshots/001-after-submit.txt`
- `snapshots/002-final.txt`

Optional when present:

- `snapshots/003-interrupt.txt`
- `snapshots/004-recover.txt`

### 3. Roll-up compatibility summary

Proposed surface:

```text
clisbot runner smoke --cli all --suite launch-trio --json
```

Purpose:

- run the small real-CLI suite across Codex, Claude, and Gemini
- emit one compatibility summary per CLI
- let the operator see launch readiness at a glance

The roll-up should not hide risk-slice evidence such as trust blockers, update drift, delayed session id capture, or prompt-submit instability.

## Required Workspace Modes

Real CLI validation should not assume the current workspace only.

At minimum, the next batch should model:

- `current`
- `fresh-copy`
- `existing-session`

These workspace modes are required because the highest-value failures often depend on context:

- trust and setup blockers appear on fresh workspaces
- continuity issues appear on existing sessions
- ordinary health checks usually run on the current workspace

## Proposed Scenario Set For The Next Batch

Do not try to test everything at once.

The next batch should only ship these real-CLI scenarios:

### `startup_ready`

Goal:

- prove the CLI reaches a truthful ready state

What it answers:

- can the runner launch the real CLI
- does startup block on trust/auth/setup
- does `probe` truthfully say `ready`, `blocked`, or `timeout`

Most important workspace mode:

- `fresh-copy`

### `first_prompt_roundtrip`

Goal:

- prove a fresh prompt can be submitted and settled

What it answers:

- did `send` actually transition from `waiting_input` to `running`
- did the CLI produce meaningful output
- did settlement happen cleanly

High-risk fixture classes:

- multiline prompt
- literal prompt starting with `/`
- prompt containing `$` or `@`

### `session_id_roundtrip`

Goal:

- prove the chosen session continuity path is real

What it answers:

- did `sessionId` get captured or injected as expected
- can the next startup reuse that same session
- is continuity real or only implied

Additional timing that should be exposed:

- time to first session id
- retry count before capture
- whether continuity came from injection or delayed capture

### `interrupt_during_run`

Goal:

- prove interrupt is at least operationally useful on the real CLI

What it answers:

- did the interrupt signal reach the live run
- did the runner observe an actual state change
- is interrupt still only best-effort for this CLI

### `recover_after_runner_loss`

Goal:

- prove pane-loss recovery for resumable CLIs

What it answers:

- can a killed tmux host be recreated
- can the stored `sessionId` reopen the same conversation context
- does recovery degrade to fresh start, or fail truthfully

## Cross-Cutting Metrics

Every scenario result should carry enough measurements to answer stability questions instead of only pass or fail.

At minimum:

- `durationMs`
- `retryCount`
- `detectionLatencyMs`
- `sessionIdLatencyMs` when applicable
- `versionBefore`
- `versionAfter` when changed
- `workspaceMode`
- `artifactDir`

These fields matter because a slow but correct result can still be operationally weak.

## What The Operator Should See

Each scenario result should expose:

```json
{
  "cli": "codex",
  "scenario": "startup_ready",
  "ok": true,
  "grade": "strong",
  "capabilities": {
    "start": "strong",
    "probe": "partial",
    "sessionId": "strong",
    "resume": "strong",
    "interrupt": "partial"
  },
  "finalState": "ready",
  "failureClass": null,
  "artifactDir": "~/.clisbot/artifacts/runner-smoke/2026-04-17T13-30-00Z-codex-startup_ready"
}
```

If it fails:

```json
{
  "cli": "gemini",
  "scenario": "startup_ready",
  "ok": false,
  "grade": "blocked",
  "finalState": "blocked",
  "failureClass": "auth-blocker",
  "errorCode": "BLOCKED",
  "artifactDir": "~/.clisbot/artifacts/runner-smoke/2026-04-17T13-30-00Z-gemini-startup_ready"
}
```

## Failure Classification

The next batch should classify failures into a short stable set:

- `launch-failed`
- `ready-timeout`
- `auth-blocker`
- `trust-blocker`
- `submit-failed`
- `settlement-failed`
- `session-id-missing`
- `resume-failed`
- `interrupt-unconfirmed`
- `runner-lost`
- `recover-failed`
- `update-drift`
- `prompt-mode-drift`

## What The Roll-Up Summary Should Tell Anh Long

After the suite runs, the output should answer five product questions immediately:

1. Which CLIs are launch-ready right now?
2. Which CLIs have real continuity, not fake continuity?
3. Which CLIs can survive runner loss?
4. Which CLIs still have weak interrupt semantics?
5. Which failures are upstream drift versus our own runner gap?

## Suggested Implementation Order

If the next batch must stay lean:

1. `startup_ready`
2. `first_prompt_roundtrip`
3. `session_id_roundtrip`
4. roll-up summary across the launch trio
5. only then `interrupt_during_run` and `recover_after_runner_loss`

That already gives a real compatibility picture without waiting for the full deterministic fake harness.

## Practical Reading

The operator should be able to read one result and answer:

- did the CLI launch in the intended workspace mode
- was it blocked by trust, auth, update drift, or something else
- how long state detection took
- how many retries were needed
- whether session continuity was injected or captured
- whether prompt submission stayed literal
- where to open the human-readable proof
