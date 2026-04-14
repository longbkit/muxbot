# Start Raw Token Warnings And Runtime Restart UX

## Summary

Track operator feedback that `clisbot start` currently creates unnecessary friction when raw Slack tokens are passed during startup.

The reported issues are:

- Slack literal-token startup can print the same warning twice for one logical account
- the security warning itself may feel overstated or inconsistently justified versus env-backed secrets
- raw-token restart flow currently rejects with `stop first` instead of helping the operator recover or understand runtime state

Current implementation direction:

- startup no longer emits raw-token leak warnings for literal CLI credentials
- `clisbot start` with literal bootstrap tokens now stops the running runtime first and relaunches with the new launch-scoped mem credentials

## Status

Completed

## Why

The current first-run and recovery surfaces needed to keep the credential model truthful while reducing restart confusion.

## Scope

- verify `clisbot start` behavior when raw token input is passed while the runtime is already running
- keep regression coverage for the chosen restart behavior

## Non-Goals

- changing the persisted credential model
- storing raw secrets in config
- broad runtime lifecycle redesign outside this startup flow

## Related Docs

- [Configuration Feature](../../../features/configuration/README.md)
- [Channel Fast Start And Credential Persistence](2026-04-13-telegram-fast-start-and-credential-persistence.md)
- [Bot Type First-Run Flag And Quick Start Refresh](2026-04-13-bot-type-first-run-flag-and-quick-start-refresh.md)

## User-Reported Examples

```text
error Raw channel token input on `clisbot start` requires the runtime to be stopped first, unless you also pass --persist.
```

## Exit Criteria

- runtime-running restart behavior is intentional and either automated or explained clearly in output
- targeted tests cover the chosen restart-path behavior
