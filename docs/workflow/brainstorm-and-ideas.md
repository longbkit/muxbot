# Brainstorm And Ideas

## Status

Working draft.

This page captures workflow ideas that are directionally strong but not yet locked as stable repo contract.

## 1. Shortest-Review-First North Star

Always push AI toward generating the shortest, easiest-to-review context first.

The closer an artifact is to the user, the easier it should be to review.

If it is hard to review, the product or workflow is probably still too hard to use.

Examples that should be reviewable early, not only after implementation spreads:

- `clisbot.json`
- CLI command shape and help text
- naming conventions
- front-door workflow surfaces
- architecture summaries before architecture detail explodes

One north-star metric:

- every AI-produced artifact should be extremely easy to understand
- if a developer or user cannot understand it quickly, there is still a product or workflow problem

## 2. Review The Most User-Near Surfaces First

The review order should usually bias toward:

1. config and naming
2. CLI surfaces
3. user-facing workflow and chat behavior
4. architecture summary and boundary model
5. implementation details

Rationale:

- config that only "works eventually" but is hard to review is already bad product design
- CLI surfaces that look acceptable only after explanation are already carrying too much friction
- architecture that leaks concepts, duplicates concepts, or blurs ownership will later corrupt both docs and code

## 3. Repeating Review Loop Checklist

One useful direction is a reusable combo skill, prompt, or checklist that AI walks repeatedly until convergence.

Suggested checklist order:

### Naming

Review:

- convention consistency
- prefix and suffix consistency
- form consistency across config, CLI, docs, and code
- short but obvious naming
- reuse of existing names instead of near-duplicates

Special rule:

- periodically group similar names together
- treat those clusters as high-leak refactor candidates
- similar names often signal duplicate logic, duplicate concept, or wrong concept boundaries

### Size and shape

Review:

- file size
- function size
- nested logic depth
- surface area that feels larger than the actual concept

### Mental model

Review:

- is the concept understandable without implementation trivia
- is architecture separated cleanly from implementation detail
- is the same concept described with one name and one owner

### User flow

Review:

- first-run flow
- debugging flow
- upgrade flow
- normal chat flow
- operator recovery flow

### Security

Review:

- dangerous exposure
- trust boundaries
- mutation surfaces
- hidden privilege paths

### Stability

Review:

- truthful state
- recovery behavior
- blast radius
- channel or runner isolation
- upgrade safety

### Dangerous fallback

Review:

- whether a fallback hides real product or architecture problems
- whether the fallback makes behavior harder to reason about later
- whether the fallback helps short term but deepens long-term coupling

The loop should keep going until the artifact is genuinely clearer, not only "acceptable enough to move on".

## 4. Task Readiness Before Execution

Another strong direction is to split AI work into at least two flows:

### Task-shaping flow

A smaller set of agents specializes in:

- creating tasks
- clarifying the task
- mapping the solution space
- reviewing the contract
- defining outcome and DoD
- pushing tasks toward true `Ready`

These agents should be judged by:

- clarity
- bounded scope
- reviewability
- correct contract and ownership

### Task-execution flow

Once a task is truly `Ready`, a different AI flow should be able to execute it with much less human follow-up.

This flow should assume:

- task contract is already sharp
- outcome is already clear
- DoD is already concrete
- validation expectations are already explicit

## 5. Reduce AI Laziness During Execution

Ready tasks still need execution discipline.

Useful tools for that may include:

- queue-based follow-up work
- loop-based repeated review
- explicit convergence passes
- structured progress or artifact checkpoints

The goal is not more verbosity.

The goal is to reduce the common lazy pattern:

- patch one local slice
- stop too early
- skip adjacent-surface review
- leave task closure to human follow-up

## 6. Possible Future Outputs

This brainstorming could later become:

- one stable workflow principles doc
- one reusable AI review checklist
- one task-readiness checklist
- one execution checklist for autonomous AI work in this repo

## Open Questions

- which checklist items should become hard rules versus guidance
- how much of the review loop should be encoded in prompts versus docs versus skills
- whether readiness should be a named backlog status with stricter admission rules
- how much queue or loop automation should be built into the repo versus left to operator flow
