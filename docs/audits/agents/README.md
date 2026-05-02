# Agent Audits

## Purpose

Use this folder for recurring audits of agent-layer behavior and the boundaries
between channels, agents, and runners when session continuity is involved.

This includes cross-layer cases where `sessionKey` stays channel or agent
routed, while `sessionId` creation or capture or mapping ownership needs to be
clarified without silently changing the public mental model.

## Typical Topics

- `sessionKey` semantics
- persisted session continuity
- queue and loop ownership boundaries
- agent-facing diagnostic surfaces
- agent and runner handoff seams that affect durable continuity

## Workflow

- keep the audit report here
- keep stable area docs in `docs/features/agents/`
- create a task doc only after the audit direction is stable
