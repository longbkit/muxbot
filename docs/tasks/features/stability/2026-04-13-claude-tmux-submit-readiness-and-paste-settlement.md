# Claude tmux Submit Readiness And Paste Settlement

## Summary

Trace and fix the real Claude Code submit failures seen in live Slack validation, without moving runner quirks into channels or hiding uncertainty behind duplicate prompt resend.

## Status

Done

## Why

Live Slack testing on April 13, 2026 exposed two Claude-specific runner failures:

- a fresh Claude workspace can stop at a trust prompt shape that the tmux runner does not currently recognize
- multiline prompt paste can become visible only after the current fixed `promptSubmitDelayMs`, so `Enter` can be sent too early and get ignored

That means the current submit path is not yet truthful or stable for Claude:

- channels accept the message
- the runner may not actually be ready for prompt submit
- the prompt body may land, but final `Enter` may not actually submit the turn
- the human may need `/nudge`, which is only a manual recovery path, not a correctness contract

## Scope

- reproduce the Claude failure against a real tmux session and live Slack route
- keep the fix inside `runners/tmux`
- harden fresh-session readiness for Claude trust prompts
- harden prompt submit so `Enter` is sent only after paste delivery has visibly settled
- add regression coverage for both failure modes
- rerun automated tests plus live Slack Claude end-to-end validation

## Non-Goals

- adding channel-level retries or hidden resend behavior
- broad runner refactor beyond the current tmux submit path
- treating `/nudge` as the normal success path

## Root Cause

The traced failures are runner-level:

1. Claude trust prompt mismatch

- current trust-prompt detection only recognizes Codex-style trust text
- Claude now shows a different safety prompt such as:
  - `Quick safety check:`
  - `Yes, I trust this folder`
  - `Enter to confirm · Esc to cancel`
- a fresh runner can therefore remain blocked even though higher layers think the session is ready

2. Paste-settlement race

- current submit logic sleeps a fixed `promptSubmitDelayMs`, captures pane state, then sends `Enter`
- for multiline Claude prompts, visible paste settlement can happen after that fixed delay
- if `Enter` is sent before the paste has visibly settled, Claude can ignore that `Enter`
- the tmux pane then shows `[Pasted text #... +N lines]`, but the prompt is still idle until a later manual `Enter`

## Implementation Direction

- keep the ownership in `runners/tmux/session-handshake.ts`
- split submit into explicit milestones:
  - pre-paste baseline
  - visible paste settlement
  - final `Enter`
  - post-enter confirmation
- detect the newer Claude trust prompt shape during startup and status-command handshake
- wait for visible paste settlement instead of assuming the fixed delay alone means the pane is ready
- keep the current truthfulness rule that prompt body is never auto-resubmitted

## Exit Criteria

- a fresh Claude session in a new workspace clears the trust prompt automatically and then accepts the first prompt
- a multiline Claude prompt does not require `/nudge` in the validated live Slack path
- the fix stays inside runner code and test coverage
- automated tests and live Slack Claude validation both pass

## Validation Notes

- automated validation:
  - `bun x tsc --noEmit`
  - `bun test`
- live validation on April 13, 2026:
  - fresh Slack thread on a fresh Claude workspace replied successfully on the first turn without `/nudge`
  - same Slack thread follow-up also replied successfully without manual recovery
  - first-turn root cause was confirmed beforehand on a raw tmux trace:
    - unrecognized Claude trust prompt blocked readiness
    - multiline paste could settle after the fixed submit delay, so early `Enter` was ignored

## Related Docs

- [tmux Submit Truthfulness And Telegram Send Reliability](2026-04-12-tmux-submit-truthfulness-and-telegram-send-reliability.md)
- [tmux Submit State Model And Input Path Separation](2026-04-13-tmux-submit-state-model-and-input-path-separation.md)
- [Stability](../../../features/non-functionals/stability/README.md)
- [Runtime Architecture](../../../architecture/architecture.md)
