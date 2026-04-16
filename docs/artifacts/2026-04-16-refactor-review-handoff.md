# 2026-04-16 Refactor Review Handoff

## Purpose

This artifact bundles the review context around the April 15-16 runner and AI-workflow discussion so the team can revisit it later without reconstructing the whole chat thread.

It is intentionally short and operator-friendly.

## What This Commit Captures

- runner ownership and state/lifecycle review artifacts
- deep function call mapping for prompt submission, tmux submission, monitoring, observer delivery, and state writes
- a new lesson on AI-assisted refactor workflow: architecture and tests before code generation
- current Slack app-manifest guidance and template updates that were already in the write set at commit time

## Main Review Artifacts

- `docs/artifacts/2026-04-16-runner-ownership-flow-visualization.html`
- `docs/artifacts/2026-04-16-runner-function-call-map.html`

## Why These Artifacts Matter

They make several hidden problems much easier to see:

- duplicated submit paths
- misleading names that leak the wrong mental model
- mixed ownership between queue admission, run lifecycle, tmux observation, and observer delivery
- heuristic-heavy transcript normalization that influences lifecycle perception indirectly
- state writes spread across several layers

## Main Takeaways For Team Review

### 1. Naming drift is not cosmetic

Names like:

- `SessionService`
- `activeRuns`
- `startRunMonitor`
- `monitorTmuxRun`
- `submitSessionInput`

sound plausible locally, but they no longer match the actual roles cleanly.

This is a design smell, not just a wording issue.

### 2. Prompt execution and monitor facts are too entangled

Current flow still mixes:

- queue admission
- prompt submission
- tmux pane polling
- lifecycle settlement
- observer fanout

That makes reasoning harder than it should be.

### 3. AI workflow should shift left into text artifacts

The new lesson added in this commit argues for:

1. architecture text first
2. folder/file/function plan
3. owner and call-flow convergence
4. tests or validation contract
5. code generation only after that

This should reduce churn in future cross-cutting refactors.

## Suggested Team Review Sequence

1. Open `runner-ownership-flow-visualization.html`
2. Open `runner-function-call-map.html`
3. Review the naming and owner-boundary hotspots first
4. Then read the AI workflow lesson
5. Only after agreement, plan the actual rename/split/merge refactor

## Related Lesson

- `docs/lessons/2026-04-16-ai-coding-workflows-should-converge-on-text-architecture-and-test-contracts-before-code-generation.md`

## Notes

This artifact is a handoff and review aid.
It is not itself the refactor plan.

The next useful step after this commit is to annotate the function-call map with:

- keep
- rename
- split
- merge
- wrong owner

so it becomes implementation-ready for a team review or a later AI-guided refactor pass.
