# Human Checklist For Real-CLI Compatibility

## Status

Source of truth input

## Purpose

This file keeps the operator's literal concerns in a human checklist form.

It should stay close to the original meaning and should not be rewritten into an implementation contract.

Use it as the grounding checklist behind capability contracts, probe surfaces, watch flows, and real-CLI validation work.

## Current Priority

- prioritize real CLI validation before fake CLI work
- keep outputs human-readable, not JSON-only
- optimize for fast truth about compatibility, state capture, and stability gaps

## Checklist

### First Launch Stability

- In a completely new workspace, the first CLI launch can be unstable because many CLIs ask whether the workspace is trusted.
- The system should make that startup blocker visible and measurable instead of treating it as a generic failure.

### Version Drift And Update Flow

- A CLI upgrade can introduce instability without warning.
- A new version may show an update notice, run an update path, or exit unexpectedly after updating.
- The system should help reveal when the problem is caused by upstream version drift instead of our own app flow.

### Session Id Capture

- Claude Code is easier because a session id can be passed in from the beginning.
- Other CLIs may not support that, so the current workaround depends on triggering `/status` and reading the session id from the output.
- That workaround is not stable enough by default because it depends on:
  - whether `/status` triggers correctly
  - whether the output format still matches the parser
  - how many retries are needed before the session id becomes available

### Ready-State Detection

- State inference is critical from the moment a CLI starts.
- The system needs to know when the CLI is truly ready to accept a pasted prompt.
- The detection quality should be evaluated by:
  - false positive rate
  - false negative rate
  - detection latency
- Even when the state is detected correctly, a slow detection can still hurt usability.

### Run-State Transitions

- After prompt submission, the system should reflect the true transition from `idle` to `processing` to `complete`.
- During a live run, sending a steering message may change the surface behavior and can expose additional instability.
- The system should verify whether state inference still remains correct while steering is happening.

### Prompt Paste And Submit Stability

- Prompt paste and submit behavior may differ across CLIs.
- The same flow may also behave differently through tmux.
- Stability here matters because a seemingly small mismatch can cause the whole run flow to fail or drift.

### Special Character And Trigger Safety

- Some prompts may contain slash commands, skill triggers, or reference syntax such as `/`, `$`, or `@`.
- Those characters may accidentally trigger CLI-native flows or alternate command modes.
- A pasted prompt may therefore behave differently from plain text input, and `Enter` may no longer submit in the expected way.
- The system should consider whether there are other special-character cases with similar risk.

### Human Observability

- The operator needs a fast way to see what the CLI is actually showing while the system is inferring state.
- JSON artifacts alone are not enough for fast operator understanding.
- The system should preserve a human-readable view of pane snapshots or live watch output so a person can quickly judge whether the inference is struggling.
