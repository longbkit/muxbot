# Code Review Checklist

## Purpose

Use this checklist when asking AI to review work in this repo.

It is intentionally short and high-leverage.

The goal is not broad generic review.

The goal is to force review through the highest-risk lenses first, then keep looping until the artifact is truly clear and defensible.

## Checklist

### 1. Readability first

If config, CLI, docs, or code is not instantly easy to understand, stop and simplify before judging anything else.

### 2. Naming and concepts

One concept should have one name.

Review:

- consistency
- prefix and suffix form
- reuse of existing naming
- near-duplicate names that may signal wrong boundaries, duplicate logic, or concept leaks

### 3. Shape and mental model

Review:

- file size
- function size
- nesting depth
- whether architecture stays cleanly separated from implementation detail

### 4. Real user path

Review the real path, not only local code quality:

- first run
- normal use
- follow-up behavior
- debug and recovery flow
- whether the surface feels predictable and easy to review from the user side

### 5. Risk sweep

Check:

- security
- stability
- dangerous fallbacks

If a fallback hides truth, deepens coupling, or makes future extension harder, reject it.

## How To Use It

Use this checklist:

- as one short prompt
- as a looped review prompt
- or one section at a time when deeper review is needed

Suggested operating mode:

- review one section
- patch
- rerun the next section
- keep looping until the result is genuinely clear instead of only superficially acceptable
