# CLI Compatibility Capability Contract

## Status

Draft v0

## Summary

This document defines the first normalized compatibility contract for upstream interactive CLIs.

The contract is for machine-readable DX and operator surfaces first.

It is intentionally stricter about normalized facts than raw terminal text.

## Design Rules

- Normalize facts, not full transcripts.
- Prefer capability and state invariants over CLI-specific banner matching.
- Make unsupported behavior explicit instead of pretending every CLI works the same.
- Separate conversation identity from runner instance identity.
- Keep the contract usable by tmux-backed runners now and non-tmux runners later.

## Core Terms

### `sessionKey`

The logical conversation identity chosen by the agents layer.

This is not a tmux target and not a CLI-native session id.

### `sessionId`

The CLI-native conversation id when the upstream CLI exposes one.

It may be absent, delayed, unsupported, or only recoverable after startup.

### `runnerInstanceId`

The live execution-host identity for the current CLI process.

Today that usually maps to a tmux-backed runner instance.

### `locator`

The minimum machine-readable information needed to target the current live runner instance.

Example shape:

```json
{
  "runnerInstanceId": "runner_default_abc123",
  "hostKind": "tmux",
  "hostRef": "clisbot:agent-default:telegram-1207"
}
```

### `normalizedState`

The shared run-state vocabulary exposed by compatibility surfaces.

Allowed values in v0:

- `starting`
- `ready`
- `waiting_input`
- `running`
- `blocked`
- `interrupted`
- `lost`
- `exited`
- `failed`
- `unknown`

## Common Response Envelope

Every capability response should normalize to this envelope:

```json
{
  "ok": true,
  "capability": "probe",
  "cli": "codex",
  "observedAt": "2026-04-17T13:20:00.000Z",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "waiting_input",
    "running": false,
    "waitingInput": true,
    "inputAccepted": true
  },
  "warnings": [],
  "error": null
}
```

Error responses should keep the same top-level keys and fill:

```json
{
  "ok": false,
  "capability": "resume",
  "cli": "codex",
  "observedAt": "2026-04-17T13:20:00.000Z",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": null,
    "locator": null
  },
  "state": {
    "normalizedState": "lost",
    "running": false,
    "waitingInput": false,
    "inputAccepted": false
  },
  "warnings": [],
  "error": {
    "code": "PANE_LOST",
    "message": "Stored runner instance could not be reached.",
    "retryable": true
  }
}
```

## Standard Error Codes

Use stable error codes instead of CLI-specific free text:

- `UNSUPPORTED`
- `NOT_FOUND`
- `NOT_READY`
- `BLOCKED`
- `SESSION_ID_UNAVAILABLE`
- `PANE_LOST`
- `TIMEOUT`
- `CONFLICT`
- `BACKEND_ERROR`
- `INVALID_INPUT`

## Capability Set

The v0 capability set is:

- `start`
- `probe`
- `send`
- `attach`
- `resume`
- `recover`
- `interrupt`

Session-id capture is modeled as a first-class sub-result of `probe`.

## Capability Contract

### 1. `start`

Start a fresh runner instance for a logical conversation, optionally with a requested session id or resume preference.

#### Input

```json
{
  "capability": "start",
  "cli": "codex",
  "sessionKey": "telegram:default:-1003455688247:1207",
  "workspacePath": "/home/node/projects/clisbot",
  "agentId": "default",
  "resumePolicy": "fresh",
  "requestedSessionId": null,
  "reason": "new-turn"
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "start",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": null,
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "starting",
    "running": false,
    "waitingInput": false,
    "inputAccepted": false
  },
  "startup": {
    "accepted": true,
    "resumeApplied": false,
    "blockers": []
  }
}
```

#### Invariants

- `start` must return a `runnerInstanceId` or fail explicitly.
- `start` must not claim `ready` until a later `probe` proves it.
- `start` must not silently convert `fresh` into resume.

### 2. `probe`

Inspect the live runner instance and return normalized readiness, running state, waiting-input truth, pane-loss truth, and session id capture truth.

#### Input

```json
{
  "capability": "probe",
  "cli": "codex",
  "locator": {
    "runnerInstanceId": "runner_default_abc123",
    "hostKind": "tmux",
    "hostRef": "clisbot:agent-default:telegram-1207"
  },
  "waitMs": 1000,
  "includeSnapshot": true
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "probe",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "waiting_input",
    "running": false,
    "waitingInput": true,
    "inputAccepted": true
  },
  "sessionIdCapture": {
    "state": "captured",
    "source": "status-command",
    "value": "sess_abc123"
  },
  "snapshot": {
    "normalizedText": "Ready for your next instruction.",
    "timerText": null,
    "meaningfulChange": false
  }
}
```

#### Invariants

- `probe` is the source of truth for `ready`, `waiting_input`, `running`, `blocked`, and `lost`.
- `probe` must expose session id capture as one of:
  - `captured`
  - `pending`
  - `unsupported`
  - `lost`
- `probe` must not require callers to parse raw pane text.

### 3. `send`

Submit prompt or control input to the currently targeted live runner instance.

#### Input

```json
{
  "capability": "send",
  "cli": "codex",
  "locator": {
    "runnerInstanceId": "runner_default_abc123",
    "hostKind": "tmux",
    "hostRef": "clisbot:agent-default:telegram-1207"
  },
  "input": {
    "kind": "prompt",
    "text": "Fix the failing Slack follow-up test.",
    "submitMode": "paste-and-enter"
  },
  "expectedStates": [
    "ready",
    "waiting_input",
    "running"
  ]
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "send",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "running",
    "running": true,
    "waitingInput": false,
    "inputAccepted": true
  },
  "submission": {
    "deliveryState": "submitted",
    "submissionId": "subm_01",
    "preState": "waiting_input",
    "postState": "running"
  }
}
```

#### Invariants

- `send` must distinguish `submitted`, `rejected`, `queued`, and `uncertain`.
- `send` must not imply model acceptance if terminal delivery is uncertain.
- `send` may target `running` state for follow-up steering, but the result must say whether that is supported or best-effort.

### 4. `attach`

Attach an observation stream or snapshot view to the live runner instance without redefining control ownership.

#### Input

```json
{
  "capability": "attach",
  "cli": "codex",
  "locator": {
    "runnerInstanceId": "runner_default_abc123",
    "hostKind": "tmux",
    "hostRef": "clisbot:agent-default:telegram-1207"
  },
  "mode": "live",
  "cursor": null,
  "includeRunningTimers": true
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "attach",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "running",
    "running": true,
    "waitingInput": false,
    "inputAccepted": true
  },
  "observation": {
    "attachState": "attached",
    "mode": "live",
    "cursor": "obs_42",
    "eventSchema": "cli-compatibility.v0.attach-event"
  }
}
```

#### Event Shape

`attach` events should normalize to:

```json
{
  "type": "snapshot",
  "cursor": "obs_43",
  "state": "running",
  "normalizedText": "Applying patch and re-running tests.",
  "timerText": "Worked for 4m 03s",
  "meaningfulChange": true
}
```

#### Invariants

- `attach` is for observation, not ownership transfer.
- Running timers may be included in running snapshots only.
- Consumers should be able to ignore raw transcript noise and still act on the event stream.

### 5. `resume`

Create or restore a live runner instance for a previously known CLI-native session id.

#### Input

```json
{
  "capability": "resume",
  "cli": "codex",
  "sessionKey": "telegram:default:-1003455688247:1207",
  "sessionId": "sess_abc123",
  "workspacePath": "/home/node/projects/clisbot",
  "agentId": "default",
  "resumePolicy": "require-resume"
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "resume",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_resume_01",
    "locator": {
      "runnerInstanceId": "runner_default_resume_01",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "starting",
    "running": false,
    "waitingInput": false,
    "inputAccepted": false
  },
  "resume": {
    "resumeState": "resumed",
    "usedStoredSessionId": true
  }
}
```

#### Invariants

- `resume` must distinguish:
  - `resumed`
  - `fresh_started`
  - `unsupported`
  - `not_found`
- `resume` must not silently start fresh when policy is `require-resume`.

### 6. `recover`

Recover from host-level loss, especially pane loss or runner-instance disappearance, while preserving logical conversation identity when possible.

#### Input

```json
{
  "capability": "recover",
  "cli": "codex",
  "sessionKey": "telegram:default:-1003455688247:1207",
  "lastKnownSessionId": "sess_abc123",
  "recoveryReason": "pane-lost",
  "recoveryPolicy": "prefer-resume"
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "recover",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_recover_01",
    "locator": {
      "runnerInstanceId": "runner_default_recover_01",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "starting",
    "running": false,
    "waitingInput": false,
    "inputAccepted": false
  },
  "recovery": {
    "recoveryState": "resumed-new-runner",
    "preservedSessionIdentity": true,
    "manualInterventionRequired": false
  }
}
```

#### Invariants

- `recover` is the explicit answer to pane loss.
- `recover` must say whether session identity was preserved.
- `recover` must not hide when manual intervention is required.

### 7. `interrupt`

Ask the CLI to stop or yield the current run.

#### Input

```json
{
  "capability": "interrupt",
  "cli": "codex",
  "locator": {
    "runnerInstanceId": "runner_default_abc123",
    "hostKind": "tmux",
    "hostRef": "clisbot:agent-default:telegram-1207"
  },
  "mode": "soft",
  "reason": "user-interrupt",
  "confirmWithinMs": 3000
}
```

#### Success Output

```json
{
  "ok": true,
  "capability": "interrupt",
  "cli": "codex",
  "session": {
    "sessionKey": "telegram:default:-1003455688247:1207",
    "sessionId": "sess_abc123",
    "runnerInstanceId": "runner_default_abc123",
    "locator": {
      "runnerInstanceId": "runner_default_abc123",
      "hostKind": "tmux",
      "hostRef": "clisbot:agent-default:telegram-1207"
    }
  },
  "state": {
    "normalizedState": "interrupted",
    "running": false,
    "waitingInput": true,
    "inputAccepted": true
  },
  "interrupt": {
    "interruptState": "confirmed",
    "mode": "soft"
  }
}
```

#### Invariants

- `interrupt` must distinguish `sent` from `confirmed`.
- `interrupt` must say when support is best-effort or unsupported.
- `interrupt` should be followed by `probe` truth, not raw-key heuristics alone.

## Recommended CLI Surface Mapping

The first machine-readable operator surface should align like this:

- `runner probe --json` -> `probe`
- `runner send --json` -> `send`
- `runner attach --json` -> `attach`
- `runner start --json` -> `start`
- `runner resume --json` -> `resume`
- `runner recover --json` -> `recover`
- `runner interrupt --json` -> `interrupt`

`probe` should remain the canonical place to answer:

- is this CLI ready
- is it waiting for input
- is it still running
- did session id capture succeed
- was the host pane lost

## What This Contract Deliberately Avoids

- exact raw pane-text schemas
- channel rendering policy
- transcript history semantics
- tmux-only terminology in public capability names
- pretending every CLI supports resume, interrupt, or session ids equally well
