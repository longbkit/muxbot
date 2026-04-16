---
title: AI Coding Workflows Should Converge On Text Architecture And Test Contracts Before Code Generation
date: 2026-04-16
area: process, architecture, ai-workflow, testing, docs
summary: When using AI on cross-cutting refactors, do not start by generating code. Start by generating text artifacts that lock the mental model: architecture, boundaries, folder structure, file names, function names, roles, and call flows. Once those converge, generate tests and only then generate code in small slices with sharply bounded context.
related:
  - docs/lessons/2026-04-16-system-design-refactors-must-converge-through-explicit-problem-framing-invariants-and-validation-loops.md
  - docs/lessons/2026-04-16-cross-cutting-refactors-need-explicit-scope-control-validation-tracking-and-surface-lockstep.md
  - docs/lessons/2026-04-11-channel-observer-delivery-must-not-own-run-lifecycle.md
  - docs/tasks/2026-04-15-session-runner-boundary-simplification-and-validation.md
  - docs/research/agents/2026-04-15-session-runner-boundary-validation.md
  - docs/artifacts/2026-04-16-runner-function-call-map.html
  - docs/artifacts/2026-04-16-runner-ownership-flow-visualization.html
---

## Context

This lesson came from the April 15-16, 2026 runtime and architecture refactor cycle around:

- prompt submission
- tmux runner ownership
- active-run lifecycle
- observer delivery
- transcript normalization
- state persistence
- resilience and recovery

The work exposed a recurring AI-workflow failure mode:

- it is easy for AI to generate code quickly
- it is much harder for that code to remain coherent when the mental model is still blurry
- once code exists, conversation often gets dragged into local patching instead of system convergence

The result is that code generation can feel productive while actually increasing ambiguity.

That happened repeatedly in this cycle:

- code and naming moved before ownership was clean
- helper functions accumulated before the boundary was named correctly
- plausible local fixes created more surfaces to audit later
- explanation effort grew because the architecture had never been cleanly locked in text first

The human feedback sharpened the real principle:

- less context in means less output out
- less output usually means less drift, less cleanup, and more control
- for AI workflows, efficiency does not come from asking for code first
- efficiency comes from shrinking the problem until code generation becomes almost mechanical

## Core Lesson

For AI-assisted refactors in this repository, the default workflow should be:

1. generate architecture and contracts in text first
2. converge on names, roles, boundaries, and call flows
3. generate tests or validation scaffolding from that contract
4. generate code only after the contract is stable
5. generate code one narrow slice at a time

Do not let AI start with code when the mental model is still fluid.

If the architecture is still under debate, code generation is usually premature.

## Why Text First Beats Code First

### 1. Code amplifies ambiguity

When the model is unclear, code generation does not remove ambiguity. It spreads it across:

- file names
- class names
- function names
- state updates
- helper layers
- tests
- docs

Then every later conversation has to spend time untangling what those names and layers now imply.

### 2. Text is cheaper to throw away

It is cheap to discard:

- a proposed folder layout
- a function list
- a naming table
- a call flow draft
- a state machine sketch

It is much more expensive to discard:

- generated code
- generated tests that encoded the wrong contract
- docs that were already written around the wrong design

### 3. Small context windows need stronger compression

AI works best when the active context is sharply compressed.

A good text artifact can compress the important truth into a form like:

- file structure
- ownership map
- state machine
- call graph
- test matrix

That is much denser and more reusable than dragging a large code surface into every subsequent prompt.

### 4. Code-first encourages local optimization over system design

Once code exists, attention naturally shifts toward:

- “how to patch this line”
- “how to rename this helper”
- “how to keep compatibility with what was just generated”

That is exactly the wrong direction if the real problem is:

- wrong owner boundary
- wrong mental model
- misleading naming
- duplicated flow
- mixed lifecycle truth

## Failure Pattern To Avoid

The bad pattern looks like this:

1. ask AI to generate code for a broad problem
2. inspect generated code
3. discover naming and boundary problems
4. add more helpers and patches to compensate
5. discover duplicated logic and deeper confusion
6. now need a big architecture review after code already sprawled

This feels fast at first, but total work goes up sharply because:

- the code becomes the thing that needs explanation
- review becomes archaeology
- later design decisions are constrained by accidental generated structure
- the team starts reasoning from implementation artifacts instead of the actual problem

## Preferred Workflow

### Phase 1. Problem framing

Before code, write the problem in plain text:

- what is wrong today
- why it is wrong
- what the target behavior is
- what invariants must hold
- what boundaries exist

Example questions:

- who owns lifecycle truth
- who owns tmux facts
- who owns observer fanout
- who owns state persistence
- what counts as evidence vs decision

### Phase 2. Architecture draft

Generate text artifacts only:

- folder structure
- file names
- class or module names
- function names
- role of each function
- state transitions
- main call flows
- anti-flows or non-goals

At this stage, do not ask for implementation yet.

Ask instead:

- are these names truthful
- are the layers minimal
- are any functions wrongly placed
- are any flows duplicated
- which helper layers are garbage

### Phase 3. Review and compress

Use the text draft to aggressively simplify:

- delete unnecessary layers
- rename generic functions into truthful ones
- merge duplicated paths
- split only where ownership becomes clearer
- rewrite the call flow until it is easy to explain aloud

If the architecture is still hard to explain simply, it is not ready for code generation.

### Phase 4. Generate validation before code

Once the text contract is stable, generate:

- test plan
- validation matrix
- regression checklist
- failure scenarios
- maybe tests first, if the slice is stable enough

This step matters because it turns “architecture intent” into “observable contract”.

### Phase 5. Generate code in narrow slices

Only then should AI generate code, and even then:

- one slice at a time
- one owner boundary at a time
- one file group at a time
- with the text contract kept in scope

Examples of safe codegen slices:

- rename and move owner surface only
- extract one helper and update call sites
- add one probe and its tests
- change one state transition and update tests

Not safe:

- “rewrite the whole runner architecture”
- “clean up the prompt path”
- “refactor this whole area for clarity”

Those are too wide unless the contract is already locked.

## Concrete Artifacts AI Should Generate Before Code

In practice, AI should first produce one or more of these:

### 1. Ownership table

For each module or service:

- owner
- responsibilities
- what it may read
- what it may write
- what it must not decide

### 2. File and function plan

For each file:

- file name
- primary purpose
- top-level functions or class methods
- role of each function
- expected callers
- expected callees

### 3. Call flow map

For each main behavior:

- entry point
- owner handoff sequence
- important branches
- terminal paths
- state writes

### 4. State machine

For each stateful area:

- states
- transitions
- triggers
- allowed side effects
- forbidden transitions

### 5. Test contract

For each important scenario:

- setup
- action
- expected state
- expected surface output
- regression risk

## Naming Rule

AI should not invent code until these are already sharp:

- file name
- module name
- class or service name
- function name
- role sentence

If naming is still vague, the implementation is almost guaranteed to drift.

Example from this cycle:

- names like `monitorTmuxRun`, `startRunMonitor`, `submitSessionInput`, and `SessionService` sounded locally plausible
- but once reviewed against actual behavior, they leaked role confusion
- the code had already encoded that confusion, so the review cost increased sharply

The right time to fight that battle was before code generation, not after.

## Test-First Variant

For stable slices, the best sequence is often:

1. architecture text
2. function and file plan
3. scenario list
4. tests
5. code

Why:

- tests force the contract to become explicit
- codegen then becomes constrained by expected behavior
- later review becomes about whether implementation satisfies contract, not whether contract is still being invented

This is especially useful for:

- state transitions
- retry behavior
- timeout semantics
- observer delivery rules
- startup recovery behavior

## Heuristic For When Codegen Is Allowed

Code generation is allowed only when the following questions have simple answers:

1. What is the owner of this behavior?
2. What is the exact function or module boundary?
3. What state is read?
4. What state is written?
5. What are the input and output contracts?
6. What tests prove it?
7. What names will be used?

If those answers are still fuzzy, generate text, not code.

## Practical Rules

For future AI-driven refactors in this repo:

- prefer architecture text over code on the first pass
- ask AI for folder structure and function inventory before implementation
- use HTML or markdown artifacts to review call graphs and ownership
- do not let AI hide uncertainty by generating helpers
- keep context windows small and contracts dense
- generate tests before code when the behavior is stable enough
- force every code slice to point back to one agreed text contract
- if the output gets too large, the scope is probably still too wide
- if explanation effort keeps increasing, stop generating code and return to text artifacts

## Compression Rule

The human phrased the operating insight very well:

- less context in
- less output out
- more efficiency

This should be treated as an engineering rule for AI workflow design.

The point is not minimalism for its own sake.

The point is to compress the problem until:

- the architecture is obvious
- the names are truthful
- the test contract is explicit
- the generated code is almost unavoidable

That is the point where AI becomes genuinely effective instead of merely fast.

## Applied Here

This lesson was applied, even if later than ideal, through artifacts like:

- runner ownership flow visualization
- runner function call map
- explicit findings and checklist docs

Those text artifacts made it much easier to:

- see duplicated paths
- challenge naming
- spot wrong owner boundaries
- separate observer from monitor
- distinguish lifecycle truth from pane heuristics

The important takeaway is not only that these artifacts were helpful.

The more important takeaway is:

they should have come earlier, before more code was generated.
