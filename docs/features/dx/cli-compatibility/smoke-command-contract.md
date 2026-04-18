# Real-CLI Smoke Command Contract

## Summary

This page defines the operator-facing contract for the first real-CLI smoke surface.

The design target is:

- easy to run manually
- machine-readable enough for automation
- stable enough that future canaries and dashboards can build on it

## Primary Commands

### Single CLI, single scenario

```text
clisbot runner smoke --cli <codex|claude|gemini> --scenario <name> --json
```

### Launch-trio suite

```text
clisbot runner smoke --cli all --suite launch-trio --json
```

## Required Flags

### `--cli`

Allowed values:

- `codex`
- `claude`
- `gemini`
- `all`

Rules:

- `all` is only valid with `--suite`
- a concrete CLI is required for `--scenario`

### `--scenario`

Allowed values in the first batch:

- `startup_ready`
- `first_prompt_roundtrip`
- `session_id_roundtrip`
- `interrupt_during_run`
- `recover_after_runner_loss`

Rules:

- mutually exclusive with `--suite`
- required when `--cli` is one concrete CLI

### `--suite`

Allowed values in the first batch:

- `launch-trio`

Rules:

- mutually exclusive with `--scenario`
- initially runs:
  - `startup_ready`
  - `first_prompt_roundtrip`
  - `session_id_roundtrip`

## Recommended Optional Flags

### `--workspace <path>`

Override the workspace used for the smoke run.

### `--agent <id>`

Pick which configured agent profile to use when CLI-specific options come from agent config.

### `--artifact-dir <path>`

Override the root artifact directory instead of the default artifact root.

### `--timeout-ms <n>`

Upper bound for the whole scenario run.

### `--keep-session`

Do not clean up the live runner session after the smoke run.

Useful when the operator wants to inspect the live pane manually after failure.

### `--json`

Emit machine-readable output to stdout.

This should be the default mode for automation.

## Exit Codes

The first batch should keep exit codes small and predictable:

- `0`: scenario or suite completed without classified failure
- `1`: scenario or suite completed with at least one classified failure
- `2`: invalid command input or invalid combination of flags
- `3`: smoke framework error before scenario execution finished

## Scenario Result Schema

Each single-scenario run should emit one JSON object like:

```json
{
  "kind": "runner-smoke-result",
  "version": "v0",
  "cli": "codex",
  "scenario": "startup_ready",
  "ok": true,
  "grade": "strong",
  "startedAt": "2026-04-17T13:30:00.000Z",
  "finishedAt": "2026-04-17T13:30:09.000Z",
  "durationMs": 9000,
  "retryCount": 2,
  "detectionLatencyMs": 3100,
  "versionBefore": "0.30.2",
  "versionAfter": "0.30.2",
  "workspaceMode": "fresh-copy",
  "session": {
    "sessionKey": "smoke:codex:startup_ready",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123"
  },
  "capabilities": {
    "start": "strong",
    "probe": "partial",
    "send": "not-run",
    "attach": "not-run",
    "resume": "not-run",
    "recover": "not-run",
    "interrupt": "not-run"
  },
  "finalState": "ready",
  "failureClass": null,
  "errorCode": null,
  "artifactDir": "~/.clisbot/artifacts/runner-smoke/2026-04-17T13-30-00Z-codex-startup_ready"
}
```

## Suite Result Schema

The launch-trio suite should emit one roll-up object:

```json
{
  "kind": "runner-smoke-suite-result",
  "version": "v0",
  "suite": "launch-trio",
  "ok": false,
  "startedAt": "2026-04-17T13:30:00.000Z",
  "finishedAt": "2026-04-17T13:34:00.000Z",
  "durationMs": 240000,
  "results": [
    {
      "cli": "codex",
      "scenario": "startup_ready",
      "ok": true,
      "grade": "strong",
      "failureClass": null,
      "artifactDir": "~/.clisbot/artifacts/runner-smoke/2026-04-17T13-30-00Z-codex-startup_ready"
    },
    {
      "cli": "gemini",
      "scenario": "startup_ready",
      "ok": false,
      "grade": "blocked",
      "failureClass": "auth-blocker",
      "artifactDir": "~/.clisbot/artifacts/runner-smoke/2026-04-17T13-31-00Z-gemini-startup_ready"
    }
  ],
  "summary": {
    "codex": {
      "launchReady": true,
      "continuityReady": true,
      "interruptConfidence": "partial"
    },
    "claude": {
      "launchReady": true,
      "continuityReady": true,
      "interruptConfidence": "partial"
    },
    "gemini": {
      "launchReady": false,
      "continuityReady": "unknown",
      "interruptConfidence": "unknown"
    }
  }
}
```

## Transition Timeline Schema

Each artifact bundle should contain a `transitions.json` file like:

```json
[
  {
    "at": "2026-04-17T13:30:01.000Z",
    "step": "start",
    "state": "starting",
    "note": "Runner instance created"
  },
  {
    "at": "2026-04-17T13:30:04.000Z",
    "step": "probe",
    "state": "waiting_input",
    "note": "Backend reached ready prompt"
  },
  {
    "at": "2026-04-17T13:30:09.000Z",
    "step": "final",
    "state": "ready",
    "note": "Scenario completed"
  }
]
```

## Strong Recommendation For The First Batch

The first batch should keep `runner smoke` read-only from the operator point of view:

- run a scenario
- produce result JSON
- save artifacts
- do not add mutation-heavy operator semantics yet

That keeps the surface narrow and makes it easier to trust.

## What This Surface Should Let Anh Long Answer Quickly

After one run, the output should let him answer:

- did the real CLI launch
- did it reach ready truthfully
- did prompt submission really work
- did continuity actually resume
- if it failed, where exactly it failed
