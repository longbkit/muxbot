---
title: Final Artifacts Must Not Echo Review Language
date: 2026-04-18
area: docs, prompts, quality
summary: Final docs and operator-facing artifacts must absorb reviewer feedback semantically, then rewrite it into clean product language instead of echoing review wording directly.
related:
  - docs/user-guide/cli-commands.md
  - docs/lessons/2026-04-08-public-artifacts-must-be-scrubbed-before-publish.md
---

## Context

This lesson comes from a `clisbot` doc rewrite session where inline review notes were attached directly to a markdown file and then used to regenerate the file.

The user later pointed out that the rewritten content still sounded like the review prompt rather than like a finished product document.

Examples of the failure pattern included lines that read like reviewer phrasing or review rebuttals rather than clean operator-facing documentation:

- wording that mirrored the feedback voice too closely
- explanation lines that sounded like internal correction notes
- command surface text that repeated the reviewer's framing instead of presenting the final contract naturally

The problem was not factual correctness alone. The deeper quality failure was that the final artifact no longer had a clean product voice.

## What Happened

The model took review feedback as direct output language instead of as semantic guidance.

That produced a form of prompt-language leakage into the final artifact:

- review phrasing was copied too literally
- internal critique language survived into the document
- corrective notes were transformed only shallowly instead of being rewritten from first principles

This is not the same as leaking a hidden system prompt.

It is closer to:

- instruction echoing
- lexical priming
- prompt overfitting
- style contamination from the review surface

## Why It Damages Quality

When this happens:

- the document sounds like a patch on top of feedback rather than a product artifact
- wording becomes defensive, explanatory, or oddly literal
- the operator mental model gets blurred by traces of the review process
- trust drops because the artifact reads like AI-generated revision debris rather than deliberate product writing

For operator docs, this is a serious quality failure, not a cosmetic issue.

## Lesson

Reviewer feedback must be converted into product meaning first, then rewritten in clean artifact language.

Do not let the wording of the review note become the wording of the final doc unless the exact phrase is genuinely the best end-user phrasing after deliberate judgment.

The artifact must read as if it was written fresh from the product contract, not as if it was assembled from margin comments.

## Practical Rule

When working from review comments, bracket notes, or inline feedback:

1. Extract the semantic issue.
2. Restate the intended product rule in your own internal words.
3. Rewrite the section from the user or operator point of view.
4. Remove all traces of reviewer voice, rebuttal voice, and correction-note tone.
5. Re-read the result and ask:
   - does this sound like final product language?
   - or does it sound like a response to review comments?

If it sounds like a response to review comments, rewrite again.

## Anti-Patterns

Avoid these patterns in final artifacts:

- “A bot does not own...”
- “X should be the only selector”
- “this should...”
- “replace ...”
- “use ... instead”

These may be valid review-note language, but they are often poor final-doc language unless carefully reframed.

## Better Rewrite Pattern

Instead of carrying review phrasing forward, rewrite toward stable product language:

- define the concept plainly
- show the rule plainly
- show the command plainly
- show the happy path plainly

The target voice is:

- concrete
- neutral
- operator-facing
- finished

## Applied Here

This lesson should be applied whenever:

- rewriting docs from inline review notes
- merging user feedback directly into markdown
- converting design critique into operator help
- revising templates or examples after review

The required standard is not merely “the feedback was addressed.”

The required standard is:

- the feedback is addressed
- the final artifact no longer sounds like feedback
