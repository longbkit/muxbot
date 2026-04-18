# Working Prompts

## Purpose

Use this page for prompts that are proving useful in real `clisbot` workflow loops.

These are not stable product contracts.

They are working operator prompts that help AI stay aligned, persistent, and reviewable over longer runs.

## Prompt 1: Progress-Aware Continuation Loop

Suggested `clisbot` slash-command usage:

```text
/loop 3 continue, update the completed items directly in the task file as progress, add any newly discovered unfinished items so you can keep following them, and always keep the original overall goal in mind so the work stays aligned
```

Suggested prompt body in English:

```text
Continue. Update the completed items directly in the task file as progress. Add any newly discovered unfinished items so you can keep following them. Always keep the original overall goal in mind so the work stays aligned with it.
```

## Why This Prompt Seems Useful

This prompt helps push the model toward:

- continuing instead of stopping after one local slice
- updating task progress in place instead of leaving progress implicit
- tracking newly discovered unfinished work instead of dropping it
- keeping the original objective visible so later loops do not drift

## Observed Operator Note

Current operator observation:

- this prompt can keep the tool working for a long time
- early signal looks promising
- it still needs continued monitoring

## Future Additions

Later, this page can grow into a small library of:

- continuation prompts
- review-loop prompts
- task-readiness prompts
- convergence prompts
