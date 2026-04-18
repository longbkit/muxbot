# Doctor CLI Upgrade Diagnostics And Schema Repair

## Summary

Add a first-class `clisbot doctor` operator surface that can diagnose common upgrade failures, explain what is wrong, and safely repair the recoverable cases.

The most important early target is version-upgrade drift where:

- config shape changed
- schema rules became stricter
- runtime or session state is stale or partially incompatible
- operators do not know whether the right next step is inspect, migrate, clear, or restart

## Status

Planned

## Why

As `clisbot` evolves, version upgrades will increasingly change:

- config shape
- schema validation rules
- route or bot defaults
- runtime-owned persisted state
- feature flags and command expectations

Without a doctor surface, operators are forced to reverse-engineer failures from:

- startup errors
- schema parse failures
- half-broken runtime status
- stale state after an upgrade

That is slow, fragile, and hard for both humans and AI agents.

## Scope

- define the first `clisbot doctor` command surface
- detect common config and schema drift after upgrade
- detect stale or suspicious runtime-owned state that blocks startup or truthful operation
- classify findings into:
  - safe auto-fix
  - operator-confirmed fix
  - manual review required
- support a dry-run diagnosis mode before mutation
- support a safe repair mode for narrowly bounded cases
- make output understandable for both humans and AI agents
- document which upgrade paths doctor is expected to handle first

## Early Target Cases

- config file exists but fails current schema validation
- config still uses renamed or deprecated fields that can be migrated safely
- credential source shape is valid historically but no longer matches current expectations
- runtime health or session state files are stale, partially corrupted, or inconsistent with current runtime truth
- a version upgrade leaves the system in a state where `status` looks confusing but the fix is mechanical

## Non-Goals

- silently rewriting config in broad or risky ways
- hiding real breaking changes behind guessy migration logic
- replacing explicit upgrade notes or release docs entirely
- auto-fixing every historical format from every old prototype

## Desired Command Shape

Initial operator direction:

- `clisbot doctor`
- `clisbot doctor --json`
- `clisbot doctor --fix`
- `clisbot doctor --fix --yes`

The exact flags can still change, but the product model should stay:

- diagnose first
- explain findings clearly
- only mutate through explicit repair mode

## Exit Criteria

- an operator can run one command after upgrade trouble and get a short, actionable diagnosis
- safe schema or config migration cases are identified explicitly
- recoverable cases have a bounded repair path
- dangerous cases stay manual instead of being auto-mutated optimistically
- doctor output is machine-readable enough for AI-assisted recovery flows

## Related Docs

- [Operator Control Surface And Debuggability](2026-04-04-operator-control-surface-and-debuggability.md)
- [Configuration Control-Plane Expansion](../configuration/2026-04-04-configuration-control-plane-expansion.md)
- [Overview Prioritization](../../../overview/prioritization.md)
