# Gemini CLI Runner Integration And Auth Gating

## Summary

Integrate Gemini CLI as a real tmux-backed runner target, then harden startup truthfulness so `clisbot` does not treat an auth-blocked Gemini pane as a healthy ready session.

## Status

In Progress

## Why

Gemini is part of the intended launch trio.

That means support needs more than help-text mentions.

The system must truthfully answer:

- how Gemini startup is detected as ready
- how Gemini session continuity is captured and resumed
- what happens when Gemini is waiting for auth instead of ready for input

## Scope

- add Gemini to tool presets, CLI help, bootstrap templates, and status surfaces
- define Gemini-native session-id capture and resume
- require an explicit ready signal before first prompt submission
- detect known Gemini auth blockers at runner startup and fail fast with clear remediation
- document the auth prerequisite for headless or routed use
- add regression coverage for readiness, auth blockers, session continuity wiring, and normalization

## Non-Goals

- embedding a Google OAuth flow inside `clisbot`
- pretending unauthenticated Gemini runtimes are healthy
- marking Slack or Telegram Gemini routes as proven without authenticated end-to-end evidence

## Current Outcome

Implemented:

- Gemini preset and bootstrap wiring
- `GEMINI.md` bootstrap template support
- startup ready pattern and timeout truthfulness
- runner-managed first-start Gemini trust-folder dismissal during readiness polling
- auth-blocker detection for Gemini OAuth startup and auth-recovery screens
- `/stats session` capture and `--resume <sessionId>` reuse
- transcript normalization coverage
- Gemini `message-tool` prompt wording is clarified for routed reply delivery without changing the configured route default

Still pending:

- success-path live end-to-end validation on an authenticated Gemini runtime under `CLISBOT_HOME=~/.clisbot-dev`

## Exit Criteria

- Gemini startup cannot silently continue from an auth-blocked or not-ready pane
- Gemini session-id strategy is explicit and covered by tests
- docs state the auth prerequisite plainly
- one authenticated success-path end-to-end validation is recorded

## Related Docs

- [Gemini CLI Runner Support](../../../features/runners/gemini-cli.md)
- [Common CLI Launch Coverage And Validation](2026-04-13-common-cli-launch-coverage-and-validation.md)
- [New CLI Test Suites](../../../tests/new-cli-tests-suites.md)
