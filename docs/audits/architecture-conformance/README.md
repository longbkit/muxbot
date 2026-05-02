# Architecture Conformance Audits

## Purpose

Use this folder for recurring audits that check whether the implementation still
matches the repository architecture documents.

## Scope

Typical topics:

- ownership boundaries between channels, agents, runners, control, and config
- session identity and persistence boundaries
- route, rendering, and runtime flow conformance
- naming or file-placement drift that makes the architecture harder to trust

## Related Docs

- feature front door:
  [docs/features/non-functionals/architecture-conformance/README.md](../../features/non-functionals/architecture-conformance/README.md)
- stable contract:
  [docs/architecture/architecture-overview.md](../../architecture/architecture-overview.md)
- stable contract:
  [docs/architecture/surface-architecture.md](../../architecture/surface-architecture.md)
- stable contract:
  [docs/architecture/architecture.md](../../architecture/architecture.md)

## Workflow

- keep the audit report itself here
- keep the stable `what` and `why` in `docs/features/`
- move follow-up work into `docs/tasks/`
