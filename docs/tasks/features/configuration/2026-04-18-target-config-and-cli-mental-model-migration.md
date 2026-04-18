# Target Config And CLI Mental Model Migration

## Summary

Move the official `clisbot` product contract fully onto:

1. `app`
2. `bots`
3. `agents`

with `bots` and `routes` as the only official operator CLI surfaces for channel setup.

## Status

In Progress

## Why

The old `channels` and `accounts` mental model leaks across config, CLI, status, docs, and tests.

That creates the wrong product story even when parts of the runtime already support the new direction.

The migration goal is not a cosmetic rename. It must leave one obvious mental model for operators and one canonical config shape for runtime code.

## Scope

- keep the official template, docs, help text, and operator guidance on the new shape only
- make official runtime and control surfaces read `app`, `bots`, and `agents`
- make legacy command surfaces fail fast instead of silently mutating config
- migrate regression tests away from old-shape fixtures
- track remaining stale suites until the migration sweep is actually converged

## Goal Guardrail

Always judge follow-up work against the same north star:

- one obvious user mental model
- one canonical config shape
- no accidental drift back toward `channels` / `accounts` / `bindings` as official product language

## References

- [2026-04-18-target-config-and-cli-migration-inventory.md](../../research/configuration/2026-04-18-target-config-and-cli-migration-inventory.md)
- [cli-commands.md](../../../user-guide/cli-commands.md)
- [clisbot.json.template](../../../../config/clisbot.json.template)

## Progress So Far

### Done in this batch

- official template name restored at `config/clisbot.json.template`
- public docs and guidance swept toward `bots` and `routes`
- legacy `accounts` surface now fail-fast instead of mutating config
- route and bot-aware runtime resolution is in place for Slack and Telegram
- migrated regression coverage now includes the main config, bootstrap, runtime-summary, bot CLI, route CLI, startup-bootstrap, agent-service, Slack route, and Telegram route slices
- the previously stale regression sweep is now migrated and green
- current broad migration verification is green at `277 pass, 0 fail`
- `bunx tsc --noEmit` is now green in this workspace

### Completed Checklist

- [x] official template name and examples point to `config/clisbot.json.template`
- [x] official config shape uses `app`, `bots`, and `agents`
- [x] official operator setup flow uses `bots` and `routes`
- [x] legacy `accounts` path no longer behaves like an official mutating surface
- [x] stale first-wave regression cluster moved onto the new shape
- [x] broad migration verification rerun after the sweep
- [x] typecheck rerun after the sweep

### Remaining obvious sweep

- no broad stale regression cluster remains from the original migration inventory
- any further work should be treated as convergence cleanup, not the first-wave migration blocker

### Follow-Up Items

- [ ] sweep compatibility-only operator strings that still mention old `channels` commands so they are clearly marked as removed guidance, not living workflow
- [ ] sweep older docs, task docs, and test-doc artifacts that still teach the old nouns without enough historical context
- [ ] decide whether the migration task can move from `In Progress` to `Done` after that convergence cleanup, or whether another adjacent slice should stay attached here

### Known Follow-Up Targets

- `src/channels/privilege-help.ts`
- `src/control/channels-cli-rendering.ts`
- `docs/tests/features/channels/slack-routing-and-follow-up.md`
- older task or research docs that intentionally preserve history but currently read too much like live guidance

## Next Steps

1. finish the convergence sweep on compatibility strings and older docs
2. once that sweep is done, reassess whether this task should move to `Done`
3. if future migration work reopens this area, start from the inventory doc instead of inventing a second mental model
