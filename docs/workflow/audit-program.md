# Audit Program

## Purpose

Use this file as the repo's operating policy for recurring audits.

The goal is to make audits a first-class source of technical-debt discovery,
without blurring:

- stable feature truth
- exploratory research
- periodic assessment
- execution work

## Boundary

- `docs/features/` owns the current canonical `what` and `why`
- `docs/research/` owns investigation and exploratory analysis
- `docs/audits/` owns recurring assessment against an expected standard
- `docs/tasks/` owns shallow execution specs, implementation detail, and
  priority-tracked delivery work

## Task Source Rule

New tasks may originate from:

- features
- research
- audits

That does not change the task-doc shape.

Task docs should stay:

- shallow
- execution-oriented
- implementation-detail friendly

Task docs should not become the main place where the long-lived `what` and
`why` are maintained. Keep that current truth in `docs/features/`.

## Audit Cadence

Suggested recurring pattern:

- daily: one or two AI-run narrow audits that check a selected area and propose
  technical debt
- weekly: one deeper cross-file audit for a higher-risk seam
- on-change: run a targeted audit after meaningful refactors or architecture
  shifts

## Audit Outcome Rule

Each audit should end in one of three outcomes:

1. no meaningful issue found
2. fix immediately
3. create or update a task in `docs/tasks/` and prioritize it through
   `docs/tasks/backlog.md`

Use [docs/overview/prioritization.md](../overview/prioritization.md) when
deciding whether a finding is urgent enough to fix immediately.

## Audit Output Rule

Each audit report should capture:

- the area
- the expected standard
- the current findings
- the short recommendation
- the task handoff when follow-up work is needed

Keep the detailed evidence in `docs/audits/`, not inside the backlog table.
