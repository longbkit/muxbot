# Slack Latency And Stability Audit

## Summary

This audit records a live Slack measurement run on April 10, 2026 against the configured `SLACK_TEST_CHANNEL`.

For this project, the two primary product metrics are:

1. delay
2. stability

The purpose of this document is to preserve a comparable baseline before further runtime changes.

## Scope

This audit covers:

- first-turn latency for a fresh Slack thread session
- follow-up latency in the same Slack thread with an already-running session
- the runner-stage timing breakdown from `CLISBOT_DEBUG_LATENCY=1`
- live validation of busy-session follow-up behavior for `additionalMessageMode`

This audit does not yet cover:

- duplicate-event stability under repeated Slack delivery
- long-running drift recovery after operator interference in tmux
- Telegram latency

## Test Conditions

- date: `2026-04-10`
- surface: Slack channel route on `SLACK_TEST_CHANNEL`
- runtime mode during measurement: foreground `serve-foreground`
- debug flag: `CLISBOT_DEBUG_LATENCY=1`
- channel response mode: `message-tool`
- agent tool: `codex`

## Test 1: Fresh Session

Prompt:

- top-level Slack mention
- expected answer: exact short token reply

Observed Slack timestamps:

- user message: `2026-04-10T08:37:53Z`
- bot reply: `2026-04-10T08:38:21Z`

Observed user-visible delay:

- about `28s`

Latency trace:

- `slack-event-accepted`: `2026-04-10T08:37:53.556Z`
- `channel-enqueue-start`: `2026-04-10T08:37:53.558Z`
- `ensure-session-ready-start`: `2026-04-10T08:37:53.564Z`
- `ensure-session-ready-new-session`: `2026-04-10T08:37:53.597Z`
- `ensure-session-ready-complete`: `2026-04-10T08:37:57.024Z`
- `runner-session-ready`: `2026-04-10T08:37:57.028Z`
- `tmux-submit-start`: `2026-04-10T08:37:57.029Z`
- `tmux-submit-complete`: `2026-04-10T08:37:57.189Z`
- `tmux-first-meaningful-delta`: `2026-04-10T08:38:11.273Z`

Derived timing:

- inbound handling to new-session launch start: about `41ms`
- new-session startup path to ready: about `3.43s`
- prompt submit path: about `160ms`
- prompt submit complete to first pane delta: about `14.08s`
- first pane delta to final Slack reply: about `10s`

## Test 2: Follow-Up In Existing Thread

Prompt:

- no mention
- reply in the same Slack thread
- expected answer: exact short token reply

Observed Slack timestamps:

- user message: `2026-04-10T08:39:15Z`
- bot reply: `2026-04-10T08:39:24Z`

Observed user-visible delay:

- about `9s`

Latency trace:

- `slack-event-accepted`: `2026-04-10T08:39:15.974Z`
- `channel-enqueue-start`: `2026-04-10T08:39:15.974Z`
- `ensure-session-ready-start`: `2026-04-10T08:39:15.976Z`
- `ensure-session-ready-existing-session`: `2026-04-10T08:39:15.990Z`
- `ensure-session-ready-complete`: `2026-04-10T08:39:15.991Z`
- `runner-session-ready`: `2026-04-10T08:39:15.997Z`
- `tmux-submit-start`: `2026-04-10T08:39:15.998Z`
- `tmux-submit-complete`: `2026-04-10T08:39:16.165Z`
- `tmux-first-meaningful-delta`: `2026-04-10T08:39:20.186Z`

Derived timing:

- inbound handling to ready on reused session: about `17ms`
- prompt submit path: about `167ms`
- prompt submit complete to first pane delta: about `4.02s`
- first pane delta to final Slack reply: about `4s`

## Current Baseline

Measured on this run:

- fresh session visible reply: about `28s`
- follow-up visible reply: about `9s`

Measured runner breakdown:

- fresh session startup overhead: about `3.4s`
- reused session startup overhead: effectively `0s`
- first meaningful pane activity after submit:
  - fresh session: about `14.1s`
  - follow-up: about `4.2s`

## What This Suggests

The largest avoidable delay sources visible in this audit are:

1. fixed new-session startup wait
2. coarse first-output detection based on pane polling
3. additional gap between first pane activity and final Slack reply

The first-turn delay is not mainly a Slack ingress problem.

The follow-up run shows that Slack acceptance and tmux submission are fast once the session already exists.

## Stability Notes

The live tests were successful in both cases:

- fresh thread routed correctly
- no-mention follow-up in the same thread routed correctly
- no duplicate prompt was observed during this audit

But stability still needs explicit validation for:

- duplicate or retried Slack events
- tmux operator interference while a run is active
- long-running threads that leave a stale processing indicator

## Comparison Guidance For Future Runs

When repeating this audit, record:

- fresh-session visible reply delay
- follow-up visible reply delay
- `ensure-session-ready-*` timing
- `tmux-submit-complete -> tmux-first-meaningful-delta`
- `tmux-first-meaningful-delta -> final Slack reply`

If a future optimization is real, it should lower one of those segments without reducing routing stability.

## Second Audit After Runner Readiness And Warm-Polling Changes

Date and time:

- fresh-session rerun started at about `2026-04-10T08:54:51Z`
- follow-up rerun started at about `2026-04-10T08:56:08Z`

Code changes under test:

- replace fixed fresh-session sleep with pane-readiness polling up to the startup budget
- poll faster before the first visible pane delta, then return to the normal stream interval

Improvement approach:

1. reduce fixed startup delay by exiting early when the tmux pane becomes non-empty before the full `startupDelayMs` budget
2. reduce first-output observation delay by using warm polling before the first meaningful pane delta instead of waiting for the full normal stream interval
3. keep the existing missing-session retry and resume behavior intact so the latency change does not reduce startup stability

### Test 3: Fresh Session After Fix

Observed Slack timestamps:

- user message: `2026-04-10T08:54:51Z`
- bot reply: `2026-04-10T08:55:24Z`

Observed user-visible delay:

- about `33s`

Latency trace:

- `slack-event-accepted`: `2026-04-10T08:54:51.193Z`
- `ensure-session-ready-new-session`: `2026-04-10T08:54:51.224Z`
- `ensure-session-ready-complete`: `2026-04-10T08:54:53.828Z`
- `tmux-submit-complete`: `2026-04-10T08:54:53.993Z`
- `tmux-first-meaningful-delta`: `2026-04-10T08:55:13.024Z`

Derived timing:

- fresh-session startup path to ready: about `2.60s`
- prompt submit complete to first pane delta: about `19.03s`

Comparison to baseline:

- startup improved from about `3.43s` to about `2.60s`
- total visible reply got worse on this sample, from about `28s` to about `33s`

Result:

- partial internal improvement only
- fixed startup overhead decreased
- primary user-visible delay did not improve on this run

### Test 4: Follow-Up In Existing Thread After Fix

Observed Slack timestamps:

- user message: `2026-04-10T08:56:08Z`
- bot reply: `2026-04-10T08:56:19Z`

Observed user-visible delay:

- about `11s`

Latency trace:

- `slack-event-accepted`: `2026-04-10T08:56:08.972Z`
- `ensure-session-ready-existing-session`: `2026-04-10T08:56:08.991Z`
- `ensure-session-ready-complete`: `2026-04-10T08:56:08.993Z`
- `tmux-submit-complete`: `2026-04-10T08:56:09.164Z`
- `tmux-first-meaningful-delta`: `2026-04-10T08:56:15.433Z`

Derived timing:

- reused session ready path stayed effectively immediate
- prompt submit complete to first pane delta: about `6.27s`

Comparison to baseline:

- baseline same-thread follow-up visible reply was about `9s`
- this sample was about `11s`

Result:

- no user-visible improvement on this run
- session reuse remained stable
- follow-up visible delay regressed on this sample

## Current Conclusion

The readiness-poll and warm-poll changes improved the fixed startup segment but did not improve the primary user-visible metrics on these live samples.

Timestamp of this conclusion:

- `2026-04-10T08:56:19Z` or later, after the follow-up rerun settled in Slack

That means the remaining dominant delay is inside the runner and agent response path, not only in tmux bootstrap or pane polling cadence.

The next long-term optimization path should focus on:

1. runner-ready detection that is specific to the actual CLI prompt state, not just non-empty pane output
2. more direct output observation than capture-pane polling for the first meaningful delta
3. message-tool delivery latency between first meaningful output and final Slack reply

## Third Audit: Existing-Session Critical Path Improvement

Date and time:

- existing-session rerun started at about `2026-04-10T09:26:13Z`

Improvement approach:

1. move Slack ack reaction, typing reaction, and assistant-status writes off the prompt-enqueue critical path
2. enqueue the routed prompt first
3. let Slack decoration writes continue in the background and clean them up after processing finishes

Why this approach:

- for an existing session, the highest-priority metric is delay from inbound Slack message to prompt delivery into the tmux session
- Slack surface decorations are useful, but they do not need to block runner submission

### Test 5: Existing Session After Slack Critical-Path Change

Observed Slack timestamps:

- user message: `2026-04-10T09:26:13Z`
- bot reply: `2026-04-10T09:26:22Z`

Observed latency trace:

- `slack-event-accepted`: `2026-04-10T09:26:13.408Z`
- `channel-enqueue-start`: `2026-04-10T09:26:13.411Z`
- `ensure-session-ready-existing-session`: `2026-04-10T09:26:13.431Z`
- `ensure-session-ready-complete`: `2026-04-10T09:26:13.432Z`
- `tmux-submit-start`: `2026-04-10T09:26:13.439Z`
- `tmux-submit-complete`: `2026-04-10T09:26:13.601Z`
- `tmux-first-meaningful-delta`: `2026-04-10T09:26:17.560Z`

Derived timing:

- accepted event to tmux submit complete: about `193ms`
- accepted event to first meaningful pane delta: about `4.15s`
- visible Slack reply delay on this sample: about `9s`

Result:

- the existing-session handoff path inside clisbot is now effectively near-immediate
- the prioritized `Slack inbound -> tmux submit` path is no longer the dominant bottleneck
- the remaining delay is mainly in agent/runtime response time after prompt delivery, not in Slack event processing or tmux submission

## Fourth Audit: Busy-Session Follow-Up Modes

Date and time:

- steer validation thread started at `2026-04-10T10:10:16Z`
- queue validation thread started at `2026-04-10T10:11:01Z`

Runtime under test:

- service restarted from the current checkout before this audit
- Slack channel runtime summary: `streaming=off response=final responseMode=message-tool additionalMessageMode=steer`

### Test 6: Default Steering In A Running Thread

Prompt flow:

1. send a top-level mention to start a new routed thread
2. while that run is still active, send a second in-thread mention that changes the priority

Observed Slack timestamps in thread `1775815816.482109`:

- first user message: `2026-04-10T10:10:16Z`
- follow-up user message: `2026-04-10T10:10:21Z`
- clisbot steering ack: `2026-04-10T10:10:24Z`
- first agent progress after steering: `2026-04-10T10:10:38Z`
- final agent summary: `2026-04-10T10:13:07Z` and `2026-04-10T10:13:08Z`

Observed behavior:

- clisbot posted `Sent to the active session as a steering message.`
- later progress explicitly reflected the steering instruction
- final answer prioritized `additionalMessageMode` and stated that steering still keeps pane monitoring active

Result:

- default `additionalMessageMode=steer` is working live on Slack
- the startup window needed to count as "busy", not only post-submit active-run state
- that gap was fixed by registering the active run earlier in `SessionService.executePrompt(...)`

### Test 7: Explicit `/queue` Follow-Up

Prompt flow:

1. send a top-level mention to start a new routed thread
2. send `/queue ...` as a later follow-up in that same thread

Observed Slack timestamps in thread `1775815861.552619`:

- first user message: `2026-04-10T10:11:01Z`
- queued follow-up message: `2026-04-10T10:11:06Z`
- first agent progress on the original run: `2026-04-10T10:11:14Z`
- original run summary: `2026-04-10T10:13:54Z`
- queued follow-up final answer: `2026-04-10T10:14:25Z`

Observed behavior:

- the queued request was delivered only after the original run settled
- the final queued answer explicitly confirmed that queued follow-up still uses clisbot-managed delivery
- no visible queued placeholder appeared on Slack because the live route had `streaming=off`, so queue settlement only became visible at final delivery time

Result:

- explicit `/queue` works live on Slack in `message-tool` mode
- queued follow-up is serialized behind the active run and still settles through clisbot itself
- live operator expectation should account for `streaming=off`: no interim queued marker is expected on the surface
