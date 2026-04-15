# Runtime Crash Containment And Service Self-Healing

## Summary

Audit `clisbot` as a long-running remote service and harden the places where one background failure can currently kill the whole runtime or leave Slack or Telegram dead until a human manually restarts it.

## Status

In Progress

## Why

`clisbot` is not just a local CLI helper. In production it behaves like a remote service:

- it runs detached for long periods
- it owns stateful Slack and Telegram connections
- it supervises tmux-backed runners
- humans expect it to survive transient faults without manual babysitting

That raises the bar beyond "works on happy path". A single uncaught rejection, silent channel loop exit, or stale health state is enough to make the bot look available while it is actually dead or partially dead.

## Scope

- audit detached-runtime crash paths in `serve-foreground`
- add explicit fatal-event handling for uncaught exceptions and unhandled promise rejections
- remove known unhandled background-task paths
- add post-start channel liveness reporting and restart or self-heal behavior
- make operator health output truthful when one surface dies but the process stays alive
- review state-store read or write paths that can turn file corruption or partial writes into runtime failure
- add regression coverage for the highest-risk failure paths

## Non-Goals

- redesigning the tmux runner architecture from scratch
- distributed HA or multi-instance leader election
- broad feature work unrelated to long-running service survival

## Current Audit Findings

### 1. No process-level fatal-event containment

`serveForeground()` only handles `SIGINT` and `SIGTERM`.

- there is no `uncaughtException` handler
- there is no `unhandledRejection` handler
- there is no last-gasp health transition before exit

Practical consequence:

- any uncaught async failure in a timer, watcher, or background service can terminate the whole detached runtime
- operators then have to notice the outage and run `clisbot start` again manually

Relevant code:

- `src/main.ts`

### 2. Session cleanup timer can produce an unhandled rejection

`AgentService.start()` schedules periodic cleanup with:

- `void this.runnerSessions.runSessionCleanup()`

That callback has no `.catch(...)`, so a transient tmux, fs, or session-store failure can become an unhandled rejection in the live detached process.

Relevant code:

- `src/agents/agent-service.ts`
- `src/agents/runner-service.ts`
- `src/agents/session-store.ts`

### 3. Telegram can stop polling and stay dead without supervisor recovery

`TelegramPollingService.pollLoop()` exits permanently on Telegram polling conflict:

- sets `this.running = false`
- logs the conflict
- returns from the loop

Nothing notifies `RuntimeSupervisor`, nothing marks runtime health as failed, and nothing attempts a bounded restart. The detached process can therefore stay alive while Telegram is already dead.

Relevant code:

- `src/channels/telegram/service.ts`
- `src/control/runtime-supervisor.ts`

### 4. Supervisor only owns startup and reload, not post-start service health

`RuntimeSupervisor` knows how to:

- create services
- start them
- stop them
- reload on config change

But the `ChannelRuntimeService` contract has no way to report:

- runtime death after successful start
- degraded connection state
- restart-needed signals

That means health can remain `active` after the real channel service has already stalled or died.

Relevant code:

- `src/control/runtime-supervisor.ts`
- `src/channels/channel-plugin.ts`
- `src/channels/slack/service.ts`
- `src/channels/telegram/service.ts`

### 5. Some runtime-owned stores are still fragile for service-grade use

There are still store paths where corruption or partial-write scenarios can turn into runtime failure or stale truth:

- `RuntimeHealthStore.read()` does raw `JSON.parse()` with no corruption fallback
- `RuntimeHealthStore.write()` uses direct overwrite, not temp-file rename
- `SessionStore.readStore()` also does raw `JSON.parse()` with no corruption fallback

These files sit on live control paths, so a bad write or bad manual edit should be absorbed with bounded recovery or quarantine instead of taking down the service or blocking status.

Relevant code:

- `src/control/runtime-health-store.ts`
- `src/agents/session-store.ts`
- `src/shared/fs.ts`

### 6. In-flight runner-session loss still recovers too weakly and degrades too abruptly

Current request-time recovery is asymmetric.

- startup and pre-prompt session loss already have recovery helpers in `RunnerService`
- but once a prompt is already running, `SessionService.startRunMonitor()` maps the error and terminally fails the run immediately
- there is no bounded retry budget for:
  - reopening the runner with the same stored `sessionId`
  - replaying the same prompt text
  - continuing the same runner conversation when the backend supports resume
- channel-facing error rendering also adds noise today:
  - Slack appends `_Error._`
  - Telegram appends `Error.`
  even when the real error message is already complete

Practical consequence:

- a transient tmux or runner-session drop mid-prompt still looks like a hard user-visible failure instead of a self-healed blip
- the final message is noisier than it should be and can look sloppy or misleading

Resilience requirement:

- fail-soft behavior is not the target by itself
- the target is bounded self-recovery first
- only after recovery is exhausted should the system degrade to an explicit, truthful failure for that affected run or surface

Relevant code:

- `src/agents/session-service.ts`
- `src/agents/runner-service.ts`
- `src/shared/transcript-rendering.ts`
- `src/config/schema.ts`
- `src/config/template.ts`

### 7. Runtime startup still has too much blast radius at the channel or account boundary

`RuntimeSupervisor.startRuntime()` still uses an all-or-nothing startup model.

- it starts `agentService`
- then starts every configured channel service instance in sequence
- if any one service start fails, it stops all channel services, stops `agentService`, and throws

Practical consequence:

- one broken Slack or Telegram account can abort the entire runtime startup
- healthy channels or healthy sibling accounts do not survive that isolated startup failure
- this still behaves like `channel start failure aborts whole runtime`, not `contain failure by owner boundary`

Relevant code:

- `src/control/runtime-supervisor.ts`

### 8. Runtime health remains too coarse at channel level, not account or service level

The persisted runtime health model still keys records by `slack` or `telegram` only.

- `RuntimeHealthStore` stores one record per channel
- `RuntimeSupervisor.reportChannelLifecycle()` marks the whole channel as `failed` when a single account reports failure after startup
- instance metadata exists, but the canonical health state is still channel-wide

Practical consequence:

- in a multi-account channel, one failed account can make operator status look like the whole channel is dead
- health truth is therefore too coarse for the actual runtime isolation model

Relevant code:

- `src/control/runtime-health-store.ts`
- `src/control/runtime-supervisor.ts`

### 9. Process-level fatal policy still exits after marking failed, with no in-place recovery path

`serveForeground()` now records fatal health truth more explicitly, but the policy still remains:

- mark runtime health failed
- stop supervisor
- exit process `1`

Practical consequence:

- any surviving `uncaughtException` or `unhandledRejection` still chooses process death and waits for operator restart or external supervision
- this is safer than silently limping, but it is not yet a self-healing strategy for a highly resilient remote service

Relevant code:

- `src/main.ts`

## Current Implementation Progress

The current P0 slice is now implemented:

- detached runtime now installs fatal handlers for `uncaughtException` and `unhandledRejection`
- fatal shutdown records channel health as `failed` before exit instead of silently disappearing
- periodic session cleanup no longer leaves an unhandled rejection path behind
- channel runtime services now have a supervisor-owned lifecycle callback for post-start health updates
- Telegram polling conflict after startup now reports a failed channel state instead of silently stopping while the pid stays alive

Still open after this slice:

- service-grade hardening for runtime-owned state files such as atomic writes and corruption-tolerant reads
- broader post-start lifecycle reporting beyond the Telegram failure path
- bounded recovery for runner session loss while a prompt is already running
- cleaner terminal rendering for already-complete error bodies
- startup containment at channel or account boundary instead of runtime-wide abort
- account- or service-granular runtime health instead of channel-only health
- a clearer process-level resilience strategy beyond mark-failed-and-exit

## Subtasks

- [ ] add detached-runtime fatal handlers for `uncaughtException` and `unhandledRejection`
- [ ] make fatal handlers mark runtime health and exit with a clear crash reason
- [ ] remove the known unhandled cleanup-timer rejection path
- [ ] extend channel runtime contract so services can emit `failed`, `degraded`, and `recovered` lifecycle events after startup
- [ ] teach `RuntimeSupervisor` to react to those lifecycle events with bounded restart or explicit failed health state
- [ ] harden Telegram polling conflict handling so it updates health truthfully and can recover when appropriate
- [ ] decide the Slack runtime rule for post-start disconnects, reconnects, and permanent failure surfacing
- [ ] make runtime-owned health or session stores corruption-tolerant and atomic where needed
- [ ] add bounded retry for runner session disappearance while a prompt is already running, reusing the stored `sessionId` and replaying the same prompt
- [ ] make the retry budget configurable with a default of `2`
- [ ] clean up terminal error rendering so completed error bodies do not get a trailing generic `Error.` or `_Error._`
- [ ] contain startup failures at the smallest owner boundary that can be isolated, so one broken account does not abort healthy channel services by default
- [ ] split runtime health truth to the real runtime ownership level, at least account-level for multi-account channels
- [ ] define process-level fatal handling policy as an explicit resilience contract:
  - when in-place recovery is allowed
  - when runtime should quarantine one owner boundary
  - when full process exit is still the correct last resort
- [ ] add targeted tests for:
  - fatal-event shutdown path
  - cleanup timer failure containment
  - Telegram post-start polling conflict
  - supervisor health transition when a started channel dies
  - in-flight runner-session loss with successful retry
  - in-flight runner-session loss after retry budget exhaustion
  - clean channel rendering for error bodies
  - startup with one broken account and one healthy account
  - health reporting when one account fails but sibling accounts remain active
  - fatal-event policy when recovery is possible versus when full exit is required

## Exit Criteria

- one background failure no longer silently kills the detached runtime without a recorded reason
- Telegram or Slack cannot die post-start while `clisbot status` still claims everything is healthy
- bounded self-heal or restart behavior exists for channel failures that should recover automatically
- in-flight runner-session loss does not fail terminally on the first recoverable blip when the runner can be resumed through the stored `sessionId`
- persistent runtime state files are handled with bounded recovery or quarantine so corruption does not become a full service outage by itself
- startup failure of one account or one service does not automatically take down unrelated healthy owners unless no safe isolation boundary exists
- runtime health reflects the real failed owner boundary closely enough that operators do not have to guess whether one account or the whole channel is down
- fatal handling policy is explicit about when the system self-recovers, when it quarantines, and when it exits
- regression coverage exists for the audited crash and silent-death paths

## Consolidated Remaining Resilience Clusters

After the latest audit passes, the remaining work groups into three clusters:

1. Session-owned recovery is still incomplete.
   - persisted-run startup recovery is not yet hardened enough
   - in-flight runner-session loss still lacks bounded same-session recovery

2. Control and slash truthfulness still has notable gaps.
   - `/stop` is still prominent because current behavior is driven by tmux-session existence, not proven active-run interruption

3. Supervisor and health isolation are still too coarse.
   - startup remains all-or-nothing across channel services
   - health truth is still channel-wide instead of account- or service-granular
   - process-level fatal handling still ends in exit rather than explicit self-heal or quarantine policy

## Implementation-Ready Checklist

Use this as the current fix-order checklist.

### 1. Session startup recovery

- Issue:
  persisted active runs can still impose too much startup risk when their tmux state is stale or partially missing
- Root cause:
  startup recovery logic is not yet hardened to the same level as the newer request-time recovery paths
- Desired behavior:
  recover or quarantine only the affected session, then let runtime startup continue
- Owner:
  `SessionService` calling `RunnerService`
- Affected files:
  - `src/agents/session-service.ts`
  - `src/agents/runner-service.ts`
- Tests needed:
  - persisted active run with missing tmux session
  - persisted active run with missing tmux server
  - runtime startup continues with unaffected sessions

### 2. `/stop` truthfulness

- Issue:
  `/stop` can report interruption based on tmux session existence rather than proven active-run interruption
- Root cause:
  slash dispatch calls `interruptSession()`, and `interruptSession()` only checks `tmux.hasSession()` before marking runtime idle and sending `Escape`
- Desired behavior:
  `/stop` should distinguish:
  - no active run
  - active run interrupted successfully
  - interrupt requested but runner state remains uncertain
- Owner:
  agents plus channels surface text
- Affected files:
  - `src/channels/interaction-processing.ts`
  - `src/agents/runner-service.ts`
  - `src/agents/session-service.ts`
  - `docs/features/agents/commands.md`
- Tests needed:
  - stop when no active run exists but tmux session still exists
  - stop when interrupt succeeds
  - stop when interrupt request cannot be verified cleanly

### 3. In-flight runner-session recovery

- Issue:
  a mid-prompt runner-session drop still becomes a terminal failure too quickly
- Root cause:
  monitor failure path maps the error and settles the run without bounded same-session recovery
- Desired behavior:
  bounded retry, same stored `sessionId`, same prompt replay, explicit failure only after retries are exhausted
- Owner:
  `SessionService` plus `RunnerService`
- Affected files:
  - `src/agents/session-service.ts`
  - `src/agents/runner-service.ts`
  - `src/shared/transcript-rendering.ts`
  - `src/config/schema.ts`
  - `src/config/template.ts`
- Tests needed:
  - successful retry after one disappearance
  - exhaustion after configured retry budget
  - clean error rendering

### 4. Startup containment by account or service boundary

- Issue:
  one broken account can still abort the entire runtime startup
- Root cause:
  `RuntimeSupervisor.startRuntime()` still tears down all channel services and `agentService` on any startup error
- Desired behavior:
  isolate startup failure to the smallest safe owner boundary and keep healthy channel services alive when possible
- Owner:
  control and channel runtime boundary
- Affected files:
  - `src/control/runtime-supervisor.ts`
  - channel plugin implementations
- Tests needed:
  - one failed account and one healthy account in the same channel
  - one failed channel and one healthy different channel

### 5. Account-granular runtime health

- Issue:
  runtime health still reports at channel level even though runtime instances are account-scoped
- Root cause:
  health document schema only stores one record per channel
- Desired behavior:
  channel summary should aggregate account health, not overwrite it; operator output should show which account failed and which remain active
- Owner:
  control
- Affected files:
  - `src/control/runtime-health-store.ts`
  - `src/control/runtime-supervisor.ts`
  - operator health rendering paths
- Tests needed:
  - one account failed, sibling account active
  - aggregated channel summary remains truthful

### 6. Process-level fatal resilience policy

- Issue:
  current fatal policy is still mark-failed-and-exit
- Root cause:
  `handleFatal()` has no branch for in-place recovery or scoped quarantine
- Desired behavior:
  explicit decision table for:
  - recover in place
  - quarantine one owner boundary
  - exit whole process only as the last resort
- Owner:
  main runtime and control supervisor
- Affected files:
  - `src/main.ts`
  - `src/control/runtime-supervisor.ts`
  - runtime health docs
- Tests needed:
  - recoverable fatal-like event path
  - unrecoverable corruption path that still exits intentionally

## Related Docs

- [Stability](../../../features/non-functionals/stability/README.md)
- [Runner Interface Standardization And tmux Runner Hardening](../runners/2026-04-04-runner-interface-standardization-and-tmux-runner-hardening.md)
- [Agents Lifecycle And State Model Hardening](../agents/2026-04-04-agents-lifecycle-and-state-model-hardening.md)
- [Operator Control Surface And Debuggability](../control/2026-04-04-operator-control-surface-and-debuggability.md)
