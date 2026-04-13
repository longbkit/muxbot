# Test Docs

## Purpose

Use `docs/tests/` as the ground-truth test layer for this repository.

These docs should be strong enough to support:

- ad hoc manual validation
- future automated test generation
- regression review when behavior changes

## Rules

- split tests by feature folder
- keep each test spec concrete and executable
- define preconditions, exact steps, and expected results
- prefer stable identifiers such as env vars, config paths, and channel ids over vague language
- update these docs when intended product behavior changes
- use [new-cli-tests-suites.md](new-cli-tests-suites.md) as the gated rollout checklist before declaring a new CLI stable

## Suggested Structure

```text
docs/tests/
  README.md
  features/
    README.md
    channels/
      README.md
    agents/
      README.md
    runners/
      README.md
    control/
      README.md
    configuration/
      README.md
```
