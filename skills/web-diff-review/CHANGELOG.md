---
version: 1.2.1
lastUpdate: 2026-05-03T13:54:02Z
forAI: false
defaultRead: false
---

# Changelog

This file is for human maintainers.
It is not intended for AI agents to read by default.

## 1.0.0 - 2026-05-03

- Merged the former `difit` and `difit-review` skills into one `web-diff-review` skill.
- Added explicit `user-review mode` and `preloaded-review mode` guidance in a single `SKILL.md`.
- Added `version` and `lastUpdate` metadata to the skill frontmatter.

## 1.1.0 - 2026-05-03

- Tightened the defaulting rules for when to use `user-review mode` versus `preloaded-review mode`.
- Clarified that preload comments should only be used when there are concrete, line-anchored findings.
- Added truthful command constraints for `--include-untracked` and documented that `--comment` accepts both a JSON object and a JSON array.

## 1.2.0 - 2026-05-03

- Added explicit guidance for GitHub PR review mode via `--pr <url>`.
- Clarified that difit imports unresolved PR review threads and that manual `--comment` findings are additive.
- Added truth-preserving target rules for stdin mode and for comparing uncommitted state against another commit or branch.

## 1.2.1 - 2026-05-03

- Added a short Tailscale access preference rule: prefer the Tailscale domain first, fall back to the Tailscale VPN IP, and reuse the user's prior exposure pattern when history makes that clear.
