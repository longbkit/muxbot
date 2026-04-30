# Prompt Injection Review

## Summary

Review how `clisbot` handles prompt injection across routed chat messages, attachments, loop prompts, steering, queueing, and tool-driven control surfaces.

The goal is to define what the product treats as untrusted prompt content, what protections already exist, and which boundaries still rely too heavily on model obedience.

## Why This Task Exists

`clisbot` accepts user text from Slack and Telegram, can prepend attachment path mentions, can replay persisted loop prompt text, and can pass operator-facing guidance into model prompts.

That makes prompt injection a first-class security concern, not only a model-quality concern.

## Review Questions

1. Which inbound fields are treated as untrusted prompt content?
2. Which instructions are currently protected only by prompt wording rather than hard enforcement?
3. Can attachment text, quoted transcripts, or loop-maintenance prompts smuggle control intent into later runs?
4. Where do we need clearer separation between user content, protected system guidance, and operator control state?
5. Which risky paths need hard enforcement in auth, control, or runtime instead of relying on the model to comply?

## Current Focus

- map every prompt assembly path that mixes trusted and untrusted text
- identify prompt-only protections that should become hard runtime checks
- name the highest-risk injection paths first
- produce small follow-up hardening tasks instead of one vague security rewrite

## Scope

- prompt assembly for normal messages, queue, steer, and loop
- attachment mention injection and attachment-derived prompt content
- protected control prompt guidance
- prompt template override surfaces
- model-facing guidance that currently stands in for enforcement

## Non-Goals

- general model jailbreak research outside repo behavior
- secret-storage review
- auth-role redesign unrelated to prompt boundaries

## Exit Criteria

- a reviewer can explain which prompt inputs are trusted versus untrusted
- prompt-only guardrails versus hard-enforced guardrails are called out explicitly
- high-risk injection paths are split into small follow-up tasks

## Related Docs

- [docs/features/non-functionals/security/README.md](../../../features/non-functionals/security/README.md)
- [2026-04-13-prompt-templates-and-overrides.md](../channels/2026-04-13-prompt-templates-and-overrides.md)
- [2026-04-14-auth-aware-cli-mutation-enforcement-and-runner-command-guardrails.md](../control/2026-04-14-auth-aware-cli-mutation-enforcement-and-runner-command-guardrails.md)
- [2026-04-14-app-and-agent-authorization-and-owner-claim.md](../auth/2026-04-14-app-and-agent-authorization-and-owner-claim.md)
