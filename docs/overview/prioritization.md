# Prioritization

## Purpose

This page defines the current task-prioritization lens for `clisbot`.

Use it when:

- deciding which tasks should be `P0`
- deciding which work should move first in `docs/tasks/backlog.md`
- reviewing whether a task is strategic product work or only local polish

## Core Rule

Prioritize work that makes `clisbot`:

- more stable
- faster
- easier to extend with new CLI backends
- easier to extend with new channels
- more native and useful inside real chat surfaces
- easier to validate end to end
- easier for AI agents to use and improve inside this repo itself

If a task improves one of those only locally, it may still matter.

If a task improves several of those at once, it should usually rise quickly.

## Current Priority Themes

### 1. Stability and runtime truthfulness

This stays at the top.

`clisbot` is a long-running agent runtime, not just a local helper script.

That means the backlog should strongly favor:

- crash containment
- truthful active-run state
- bounded recovery and self-healing
- health surfaces that match real runtime state
- channel and runner behavior that does not silently degrade

## 2. Speed and low-friction response time

Speed is not polish.

Slow routing, slow submit, slow follow-up handling, or slow channel delivery directly reduces product quality.

The backlog should keep pushing on:

- channel-to-runner delay
- submit latency
- follow-up responsiveness
- preview and final reply speed
- operator debug speed when something goes wrong

## 3. Easy integration for new CLI backends

The architecture should make new CLI integration cheaper over time.

That means prioritizing:

- cleaner runner contracts
- less backend-specific leakage outside runner boundaries
- clear compatibility expectations
- reusable validation and smoke surfaces
- fewer hidden assumptions tied to only Codex, Claude, or Gemini

## 4. Easy integration for new channels

The architecture should also make channel expansion cheaper over time.

That means prioritizing:

- stable channel plugin seams
- channel-owned transport and rendering boundaries
- reusable route, status, auth, and lifecycle patterns
- fewer Slack-only or Telegram-only assumptions leaking into shared layers

## 5. Native channel chat experience

Slack, Telegram, and future channels should feel native, not like terminal mirrors.

That means prioritizing:

- native rendering
- strong follow-up behavior
- clean thread or topic awareness
- good reply targeting
- useful processing feedback
- conversation UX that matches the channel instead of fighting it

## 6. End-to-end validation and AI-operable hooks

This project should be easy to validate through real end-to-end flows, not only unit tests.

That means prioritizing:

- end-to-end test surfaces
- smoke and canary flows
- stable runner-debug workflows
- artifact capture
- message or control hooks that AI agents can use reliably

## 7. Improve the AI workflow of this repo itself

`clisbot` should be one of the first places where the team can improve AI-assisted engineering workflow for real.

That means prioritizing:

- better agent reply workflows
- better review and regression loops
- clearer prompt or command contracts
- repo-local tooling that makes AI work faster and safer
- docs that help another AI agent continue without rediscovering the whole system

## Priority Heuristics

Treat a task as strong `P0` candidate when it does one or more of these:

- removes a real stability or truthfulness risk
- improves speed on a critical user path
- makes adding a new CLI materially easier
- makes adding a new channel materially easier
- improves native chat UX on the core Slack or Telegram surfaces
- adds reusable end-to-end validation leverage
- improves AI workflow for the repo in a way that compounds future delivery speed

Treat a task as lower priority when it is mostly:

- local polish with little leverage
- a narrow rename with no real simplification
- a one-off workaround that deepens coupling
- speculative expansion before the current foundations are strong enough

## How To Use This With The Backlog

- `docs/tasks/backlog.md` remains the source of truth for status and priority.
- This page explains how that priority should be decided.
- If a planned task conflicts with these themes, rewrite the task note before moving it up.

## Related Docs

- [Overview](README.md)
- [Launch MVP Path](launch-mvp-path.md)
- [Task Docs](../tasks/README.md)
- [Backlog](../tasks/backlog.md)
- [Stability](../features/non-functionals/stability/README.md)
- [DX](../features/dx/README.md)
