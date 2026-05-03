---
name: web-diff-review
description: A skill for opening diffs in difit for user review, or for reviewing a specific diff or PR first and preloading findings into difit as inline comments. Use it after code changes, for commit or branch comparisons, or when a human-readable web diff with anchored comments is the best review surface.
version: 1.2.1
lastUpdate: 2026-05-03T13:54:02Z
---

# Web Diff Review

Use this skill when a diff should be reviewed in difit.

This single skill covers both common difit workflows:

- ask the user to review current changes or a specific diff in difit
- review the diff first, then launch difit with findings or explanations preloaded as inline comments

## Pick The difit Command First

Before running commands, choose `<difit-command>` using this rule:

- If `command -v difit` succeeds, use `difit`.
- Otherwise, use `npx difit`.
- If falling back to `npx difit` would require network access in a sandboxed environment without network permission, request the required approval first.

## Decide Which Review Mode Fits

Choose one of these modes:

1. `user-review mode`
   Use this when the goal is to hand the diff to the user for review after code changes.

2. `preloaded-review mode`
   Use this when the user wants review findings, code explanations, or guided comments already attached inside difit.

Defaulting rules:

- If the user asks to review, audit, explain, or highlight issues in a diff or PR, default to `preloaded-review mode`.
- If the user only wants to open, show, or share the diff as a review surface, default to `user-review mode`.
- If there are no concrete findings worth attaching to lines, prefer `user-review mode` even when the request sounds review-oriented.

## Choose The Diff Target

Use the smallest truthful diff target for the request.

Common launch forms:

- review uncommitted changes: `<difit-command> .`
- review the HEAD commit: `<difit-command>`
- review staged changes: `<difit-command> staged`
- review unstaged changes only: `<difit-command> working`
- review a specific commit: `<difit-command> <target>`
- compare two commits or branches: `<difit-command> <target> [compare-with]`
- review a GitHub PR URL: `<difit-command> --pr <url>`
- pass stdin diff input: `diff -u file1.txt file2.txt | <difit-command>`
- force stdin mode explicitly when needed: `diff -u file1.txt file2.txt | <difit-command> -`

For uncommitted changes, if untracked files should appear too, add `--include-untracked`.
Use `--include-untracked` only with `.` or `working`.
If the user wants to compare uncommitted state against another commit or branch, use `.` rather than `working` or `staged`.
Prefer explicit `-` for stdin mode when also using flags and you do not want mode detection to be ambiguous.

## User-Review Mode

Use this flow when the user mainly needs difit as a review surface.

1. Choose the correct diff target.
2. Launch difit.
3. Share the difit URL with the user.
   When the user mentions Tailscale access, prefer a Tailscale domain first, fall back to the Tailscale VPN IP when needed, and follow the user's prior exposure pattern when history makes that clear.
4. Wait for difit to exit.
5. If review comments are returned on stdout, continue work and address them.
6. If the server is closed without comments, treat that as "no review comments were provided."

No manual verification of whether the launched page opened correctly is required.
No restart is needed just because the user closed difit without comments.

## Preloaded-Review Mode

Use this flow when the user wants findings or explanations anchored directly in the diff.

1. Inspect the requested diff carefully.
2. Read surrounding code when needed.
3. Prepare concrete comments.
4. Launch difit with one or more `--comment` arguments.
5. Share the difit URL with the user.

If review findings are weak, generic, or not line-anchored, do not force preload comments just because the mode could support them.
Prefer a clean difit launch over noisy low-value comments.

For PR reviews:

- prefer `<difit-command> --pr <url>` when the user gives a GitHub PR URL
- allow difit to import unresolved inline PR threads automatically
- add manual `--comment` findings on top of imported PR threads when needed
- keep the review result limited to difit output
- do not post comments back to remote GitHub

## Comment Format

The final command typically looks like this:

```bash
<difit-command> <target> [compare-with] \
  --comment '{"type":"thread","filePath":"src/foobar.ts","position":{"side":"old","line":102},"body":"line 1\nline 2"}' \
  --comment '{"type":"thread","filePath":"src/example.ts","position":{"side":"new","line":{"start":36,"end":39}},"body":"Range comment for L36-L39"}'
```

Comment rules:

- `--comment` accepts either a single JSON object or a JSON array.
- Use `type: "thread"` for each comment.
- Write comment bodies in the language the user is using.
- Use `position.side: "new"` for lines that exist on the target side of the diff.
- Use `position.side: "old"` for lines that exist only on the deleted side.
- Use range comments for issues that span multiple lines.
- Keep each comment concrete and tied to the diff.
- Never copy secrets, tokens, passwords, API keys, private keys, or other credential-like material from the diff into `--comment` bodies or any command-line arguments.

If there are no prepared comments, say so explicitly rather than pretending there were findings.

## When To Preload Comments

Preload comments when any of these are true:

- the user asked for a code review
- the user asked for an explanation of a specific diff
- the user asked to highlight issues before they review it
- the user wants a ready-made review link with inline guidance
- the agent already has concrete, line-anchored findings that would save the user time

Do not preload comments when the user only wants a plain review surface unless there is clear value in adding context.

## Constraints

- Use this only inside a Git-managed directory unless the input is a standalone diff through stdin.
- Do not post review output to GitHub or another remote system unless the user explicitly asks.
- Do not assume that closing difit means the review failed.
