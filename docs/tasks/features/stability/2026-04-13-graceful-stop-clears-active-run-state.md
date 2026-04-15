# Graceful Stop Clears Active Run State

## Summary

Fix graceful runtime shutdown so `clisbot stop` clears persisted active-run state before exit, preventing `clisbot status` from showing stale `Active runs` after the runtime has intentionally stopped supervising them.

## Status

Done

## Why

After fixing zombie-pid truthfulness, one more shutdown truthfulness bug remained:

- the runtime process could stop cleanly
- persisted session runtime records could still say `running` or `detached`
- operator status would then show `Active runs` even though no runtime was alive to supervise or settle them

That is misleading. Active-run state only makes sense while a live runtime still owns that supervision loop.

## Scope

- trace graceful shutdown ownership for persisted active-run state
- clear active-run persistence during `AgentService.stop()`
- keep the fix in the agents lifecycle layer, not in channel code
- add regression coverage for service stop and operator status after stop
- rerun automated validation

## Non-Goals

- redesigning long-term active-run persistence semantics across crashes
- changing detached-run behavior during normal runtime operation
- masking stale data only in the status renderer

## Root Cause

`SessionService` persisted `runtime.state = running|detached` into session storage, but graceful shutdown only cleared timers and loop state. It never marked those persisted runtimes back to `idle`.

So after a normal stop, the control surface read old active-run records from the session store and rendered them as if supervision still existed.

## Implementation

- added graceful shutdown cleanup in `SessionService`
- on shutdown, every in-memory active run is marked `idle` in session state before the manager is cleared
- `AgentService.stop()` now delegates to that shutdown path
- operator status becomes truthful again without special-case rendering hacks

## Validation Notes

- targeted regression:
  - `bun test test/agent-service.test.ts test/runtime-summary.test.ts`
- repository typecheck:
  - `bun x tsc --noEmit`
- full suite:
  - `bun test`

## Follow-Up

- crash recovery and cross-restart semantics for persisted active-run state still belong to the separate backlog item about splitting active-run persistence from session continuity
