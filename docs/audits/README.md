# Audits

## Purpose

Use `docs/audits/` for periodic structured assessments of the current system
against an expected standard.

This folder is intentionally first-class. Audit output is not just another form
of open-ended research.

## What Belongs Here

Use this folder for:

- dated audit reports
- recurring architecture, runtime, security, or UX assessments
- evidence that can later create direct follow-up work

Do not use this folder for:

- stable product or system contracts that belong in `docs/features/`
- exploratory investigation that still belongs in `docs/research/`
- execution tracking or long-lived action lists that belong in `docs/tasks/`

## Boundary

- `docs/features/` owns the current canonical `what` and `why`
- `docs/research/` owns exploratory analysis and investigation
- `docs/audits/` owns recurring assessment against an expected standard
- `docs/tasks/` owns shallow execution specs, implementation detail, and
  priority-tracked follow-up work

Tasks may originate from:

- features
- research
- audits

When an audit finds a real issue:

1. fix it immediately if the issue is severe enough
2. otherwise create a task doc and add it to `docs/tasks/backlog.md`

## Structure

Suggested structure:

```text
docs/audits/
  README.md
  <feature>/
    README.md
    yyyy-MM-dd-<audit-name>.md
```

Use stable feature or non-functional area names that match the repo's existing
navigation model when possible.

## Report Rules

- keep one audit per dated file
- put the clearest findings near the top
- link to the relevant feature docs, research docs, and task docs
- keep action items short and hand them off to `docs/tasks/`
- avoid turning one audit file into a long-running mutable workboard
