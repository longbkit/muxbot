# Upcoming

Use this file as the staging area for work that is expected to become the next public release note.

For beta or pre-release builds, keep notes here until the public version ships. When the release note is cut, move the meaningful beta history into that version's `Pre-Release History` section.

## Summary

Durable queue control plus loop/session truthfulness improvements are being
staged for the next release.

## Operator Impact

- None yet.

## Functional Changes

### Channels

- Added Telegram native command-menu registration for `/new` with the clearer
  description `Start new session`.
- Changed `/whoami` and `/status` to show `sessionName` instead of
  `sessionKey`, removed principal format/example hints, and stopped echoing
  route `responseMode` in `/status`.
- Changed `/whoami` and `/status` to show `sessionId` plus persistence
  annotation instead of presenting persisted `storedSessionId` as the only
  visible truth.
- Added per-loop `--loop-start <none|brief|full>` overrides for recurring
  `/loop` creation, so one loop can suppress or expand scheduled start
  notifications without changing the route default.

### Auth

- None yet.

### Agents

- Added durable session-scoped queue items under `StoredSessionEntry.queues`.
  Chat `/queue`, route `additionalMessageMode: "queue"`, and `clisbot queues`
  now share the same queue item model.
- Added a configurable per-session pending queue limit:
  `control.queue.maxPendingItemsPerSession`, default `20` when omitted.
- Changed `/whoami` to show `sessionId` plus whether that value is already
  persisted, while still avoiding live runner probing from the chat surface.

### Runners

- None yet.

### Control

- Added `clisbot queues list|status|create|clear` for app-wide or scoped queue
  inspection, explicit routed creation, and pending-only clear.
- Added the same per-loop `--loop-start <none|brief|full>` override to
  recurring `clisbot loops create`, while keeping the route default behavior
  when the flag is omitted.
- Changed `clisbot queues create` to post a queue-created acknowledgement on
  the target surface after persistence, including queue position and the full
  submitted prompt, so CLI-created queued work is visible before it starts.
- Changed `clisbot runner list|watch` missing-session wording from `none` to
  `not stored`, so operators do not confuse missing persistence with proof
  that the live runner pane lacks a session id.

### Configuration

- Added optional `control.queue.maxPendingItemsPerSession`. The default config
  template omits it so future release defaults can change without pinning old
  generated config files.

### DX

- None yet.

## Non-Functional Changes

### Stability

- Fixed startup ready-pattern matching so stale prompt markers earlier in a tmux
  pane do not let first-submit proceed before the currently launching runner is
  actually ready.
- Fixed mid-run recovery for runners that use explicit session ids without a
  separate resume command; recovery now restarts with the stored id instead of
  clearing and rotating it.
- Fixed ambiguous stale-resume startup and `/new` capture failure behavior so
  clisbot preserves the stored session id instead of clearing it eagerly on
  weak evidence.
- Fixed live-runner `/new` retry behavior so clisbot now retries session-id
  capture without blindly re-submitting `/new`, and surfaces one user-visible
  failure reply on Slack or Telegram when capture or persistence still fails.
- Fixed mid-run recovery fallback gating so clisbot now decides from the actual
  stored resumable session id instead of backend session-id capability flags
  when choosing between manual `/new` and fresh-session fallback.
- Fixed fresh-runner startup visibility so when the runner becomes ready before
  clisbot captures a durable session id, the active chat surface now gets a
  clear warning that the session is running but not yet resumable.
- Fixed status-command session-id capture fallback so full-pane rewrites can
  still read the cleaned `/status` delta when the raw append exists but does
  not contain the session id.
- Fixed fresh-runner session-id capture so a newly created runner retries after
  an initial null `/status` result instead of staying at `storedSessionId:
  none` until a later operator action happens to recapture it.
- Fixed existing tmux session reuse when the stored `sessionId` is missing:
  clisbot now captures the runner conversation id before submitting the next
  prompt instead of keeping the session entry permanently non-resumable.
- Fixed tmux session targeting to use exact session-name matches instead of
  tmux prefix matching, so a routed surface with no stored `sessionId` cannot
  silently reuse a foreign live runner whose name shares the same prefix.
- Changed tmux session naming from plain normalized text to a readable prefix
  plus a stable short `sessionKey` hash, so two logical sessions can no longer
  collapse onto the same exact tmux runner name after normalization.
- Fixed `clisbot restart` recovery for the case where `stop` reports a timeout
  but `status` already shows the service is stopped; restart now continues into
  `start` and prints the stop warning instead of leaving the service down.
- Fixed durable queued prompts in message-tool mode so a tool-delivered final
  reply settles the running queue item without waiting for a later pane
  settlement or posting a duplicate final.
- Fixed running-state reconciliation for tmux panes that are already idle:
  stale active timer lines in scrollback no longer keep a session `running`,
  and rehydrated active runs can settle without waiting for another pane
  change.
- Fixed chat `/stop` so it clears clisbot's active-run state and unblocks the
  next queued prompt after sending the runner interrupt, instead of depending
  only on later pane settlement.
- Fixed operator active-run listing so stale persisted `running` projections
  with no matching tmux session are cleared instead of continuing to show
  `runner=lost`.
- Fixed durable queue reconciliation so a persisted `running` queue item from a
  completed or stopped run is cleared once the session is idle, allowing newer
  pending queue items and follow-up routing to proceed.
- Fixed recurring loop cancellation and lookup boundaries so current-session
  loop commands resolve by `sessionKey + loopId` internally, preventing the
  wrong session from being touched if two sessions ever share the same short
  loop id.
- Fixed Telegram topic mode persistence so creating a topic-level streaming,
  response-mode, or additional-message override preserves the parent route's
  admission flags instead of silently resetting `requireMention`/`allowBots`
  on the next config rewrite.
- Fixed `clisbot runner list` cost regression so the command no longer captures
  every live tmux pane just to infer session ids; it now reports only the
  session identity already present in durable state.

### Security

- None yet.

### Architecture Conformance

- None yet.

### Runtime Benchmarks

- None yet.

## Update Notes

- None yet.

## Validation

- `bun run check`
- `bun run build`
- `git diff --check`

## Links

- [Queues CLI](../features/control/queues-cli.md)
