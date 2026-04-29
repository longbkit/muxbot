# Scoped Loops List

## Summary

Add scoped filtering to `clisbot loops list` so it matches the routed-session
inspection shape already available through `clisbot loops status`.

## Status

Done

## Priority

P0

## Why

Today `clisbot loops status --channel ... --target ...` can answer the
session-scoped `/loop status` question, but `clisbot loops list` remains
app-wide only. That mismatch forces operators and agents to remember that
`status` narrows by routed surface while `list` does not.

`list` and `status` should differ only in output intent, not in addressability.

## Target Contract

- keep bare `clisbot loops list` as app-wide inventory
- keep bare `clisbot loops status` as app-wide inventory or richer app status
- add scoped list filters:
  - `clisbot loops list --channel slack --target group:C123 --thread-id 171...`
  - `clisbot loops list --channel telegram --target group:-1001234567890 --topic-id 42`
- preserve scoped `clisbot loops status --channel ... --target ...`

## Addressing Rules

- preferred Telegram route targets use canonical route syntax such as
  `group:-1001234567890`, not a bare raw chat id
- `--topic-id` narrows a Telegram group route to one topic
- bare numeric Telegram chat ids may remain compatibility input where existing
  loop creation already accepts them, but new docs and examples should not make
  them the preferred contract

## Exit Criteria

- `clisbot loops list` supports app-wide and scoped inspection.
- `clisbot loops list` and `clisbot loops status` share one addressing parser.
- Help, user guide, and tests show scoped list examples next to scoped status
  examples.

## Implementation

Implemented on 2026-04-29.

- `clisbot loops list --channel ... --target ...` now renders the same scoped
  session inventory shape as scoped status.
- Public filters stay on `--channel/--target` because that already addresses
  the routed surfaces.
