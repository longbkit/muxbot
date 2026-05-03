# Content Architecture

Use this file when improving `queue-workflow` itself or any similar skill.

The goal is to save context without making the reader bounce across too many tiny files.

Read this file when you need:

- file split heuristics
- anti-ambiguity rules
- a checklist for human + AI readability

See also:

- [../SKILL.md](../SKILL.md) for the actual queue-first workflow
- [queue-recipes.md](queue-recipes.md) for operational queue plans and command templates

## File Split Heuristics

Split by decision surface, not by arbitrary document length.

Good split:

- `SKILL.md`: trigger, workflow, selection, navigation, reporting
- one reference for queue plans and command templates
- one reference for content structure and anti-ambiguity rules

Bad split:

- one file for every tiny subtopic
- one file for examples, one for notes, one for caveats, one for reminders, when all belong to the same decision

## Size Rule

Keep files small enough that loading one file does not waste context, but large enough that loading it solves a real subproblem completely.

Preferred shape:

- one short coordinator file
- a few dense reference files
- each reference file should answer one coherent question end to end

## Related Content

Put related material together:

- queue depth and queue plan selection belong near each other
- command templates belong near operational recipes
- anti-ambiguity rules belong near authoring guidance

Link directly between neighboring decision surfaces when a reader will likely need both.

## Anti-Ambiguity Rules

Write so both humans and AI can act without guessing:

- define what "small", "medium", and "large" mean operationally
- say when to use a rule and when to skip it
- prefer examples that match the real command surface
- avoid vague verbs like "improve", "refine", or "check more" unless the scope is named
- avoid hidden assumptions such as "the repo probably has a glossary" unless the rule says what to do if it does not
- if no glossary exists, reuse the repo's dominant existing terms and choose boring obvious names

## Immediate Use

Each file should become useful within the first screenful.

That means:

- start with purpose
- then give the operational rules
- then examples
- keep long rationale brief unless it changes behavior

## Human + AI Readability

Optimize for both:

- short section names
- direct wording
- explicit links
- no decorative prose
- enough context in each example that it can be copied or adapted immediately

## Revision Checklist

Before finishing a skill update, check:

1. Can the top-level skill be understood quickly?
2. Does each reference file solve one coherent problem?
3. Is any file too small to justify its own load?
4. Is any file too broad to be immediately useful?
5. Are concrete commands and concrete prompt examples truthful?
6. Would a human operator and an AI agent interpret the same sentence the same way?
