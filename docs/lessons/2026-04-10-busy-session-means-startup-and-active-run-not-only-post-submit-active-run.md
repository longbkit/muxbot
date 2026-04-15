# Busy Session Means Startup And Active Run

## Context

Human intent for `additionalMessageMode` was "what should happen when the session is busy", not the narrower implementation detail "what should happen after the run has already finished prompt preparation and entered the active-run map".

## Lesson

When clisbot exposes a user-facing busy-session policy:

- treat startup, prompt preparation, and active execution as one busy interval
- do not gate busy-session behavior only on a late runtime marker if the human expectation starts earlier
- validate with a real follow-up sent shortly after the first message, not only with unit tests that mock an already-active run

## Applied Here

`additionalMessageMode: "steer"` initially checked only `hasActiveRun`, which missed the startup window.

The fix moved the active-run registration earlier in `SessionService.executePrompt(...)`, so follow-up steering now works while the first turn is still preparing the tmux session.
