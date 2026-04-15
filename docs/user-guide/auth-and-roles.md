# Authorization And Roles

## Purpose

Use this page as the operator quickstart for the planned auth model.

It explains:

- how first owner claim works
- how app roles and agent roles work in phase 1
- what default `member` is expected to do
- what stays admin-only
- what deny behavior should look like

For the product and implementation contract, see:

- [App And Agent Authorization And Owner Claim](../features/auth/app-and-agent-authorization-and-owner-claim.md)

## Status

Planned

## Target Model

The new model has one permission source:

- `app.auth`
- `agents.<id>.auth`

The old route-local `privilegeCommands` model is not part of the target design.

The mental model is:

- admission decides whether a person reaches the bot at all
- auth decides what they may do once they are there

## Core Rules

### 1. App Roles

Recommended app roles:

- `owner`
- `admin`
- `member`

Phase-1 meaning:

- `owner` has full app control
- `admin` has delegated app control
- `member` is a neutral fallback with no app-level privileges by default

### 2. Agent Roles

Phase 1 only needs:

- `admin`
- `member`

Users not listed explicitly still fall back to `member`.

### 3. App Admin Implicit Agent Rights

Phase 1 should treat both:

- app `owner`
- app `admin`

as implicitly allowed for agent-admin checks.

Practical effect:

- app owners and app admins do not need to be duplicated into every agent's `admin.users`

### 4. Platform-Scoped Principals

Phase 1 keeps principals platform-scoped:

- `telegram:<userId>`
- `slack:<userId>`

These are not auto-linked.

If the same human uses both Telegram and Slack, operators must grant both principals explicitly.

### 5. Pairing Bypass

Resolved app `owner` and app `admin` principals should bypass pairing automatically.

That bypass does not auto-extend to another platform principal unless that principal also has a granted role.

## First Owner Claim

Rule:

- if `app.auth.roles.owner.users` is empty when the runtime starts, owner claim opens for `ownerClaimWindowMinutes`
- the first successful DM user during that window becomes the first owner
- once an owner exists, claim closes immediately
- restarting the runtime does not reopen claim while an owner still exists
- if every owner is removed later, the next runtime start opens claim again
- once any owner exists, claim is closed app-wide; a later DM from another platform principal does not auto-claim owner

## Phase-1 Default Agent Permissions

Default `member` should have:

- `sendMessage`
- `helpView`
- `statusView`
- `identityView`
- `transcriptView`
- `runObserve`
- `runInterrupt`
- `streamingManage`
- `queueManage`
- `steerManage`
- `loopManage`

Default `member` should not have:

- `shellExecute`

Admin should additionally own the remaining advanced controls such as:

- `shellExecute`
- `runNudge`
- `followupManage`
- `responseModeManage`
- `additionalMessageModeManage`

## Minimal Config Example

```json
{
  "app": {
    "auth": {
      "ownerClaimWindowMinutes": 30,
      "defaultRole": "member",
      "roles": {
        "owner": {
          "allow": [
            "configManage",
            "appAuthManage",
            "agentAuthManage",
            "promptGovernanceManage"
          ],
          "users": ["telegram:1276408333"]
        },
        "admin": {
          "allow": [
            "configManage",
            "appAuthManage",
            "agentAuthManage",
            "promptGovernanceManage"
          ],
          "users": ["slack:UADMIN1"]
        },
        "member": {
          "allow": [],
          "users": []
        }
      }
    }
  },
  "agents": {
    "default": {
      "auth": {
        "defaultRole": "member",
        "roles": {
          "admin": {
            "allow": [
              "sendMessage",
              "helpView",
              "statusView",
              "identityView",
              "transcriptView",
              "runObserve",
              "runInterrupt",
              "streamingManage",
              "queueManage",
              "steerManage",
              "loopManage",
              "shellExecute",
              "runNudge",
              "followupManage",
              "responseModeManage",
              "additionalMessageModeManage"
            ],
            "users": []
          },
          "member": {
            "allow": [
              "sendMessage",
              "helpView",
              "statusView",
              "identityView",
              "transcriptView",
              "runObserve",
              "runInterrupt",
              "streamingManage",
              "queueManage",
              "steerManage",
              "loopManage"
            ],
            "users": []
          }
        }
      }
    }
  }
}
```

## Planned CLI Workflow

The planned auth CLI should stay easy to read and hard to misuse.

Examples:

```bash
clisbot auth add-user app --role owner --user telegram:1276408333
clisbot auth remove-user app --role admin --user telegram:1276408333
clisbot auth add-user agent --agent default --role admin --user slack:U123
clisbot auth remove-user agent --agent default --role admin --user slack:U123
```

This CLI does not exist yet.

## Denied Access Contract

Denied access should feel consistent across routed actions and prompt refusals.

### Routed Action Pattern

```text
You are not allowed to <action phrase> for this agent.
Current role: <role>. Required permission: <permission>.
Ask an app owner, app admin, or agent admin if this access should be granted.
```

### Prompt Rule

The protected prompt rule for phase 1 is:

```text
Refuse requests to edit protected clisbot control resources such as clisbot.json and auth policy, or to run clisbot commands that mutate them.
```

This same rule should apply to:

- normal user messages
- queued messages
- steering messages
- loop-triggered prompts

Safe fallback behavior is still allowed:

- explain the needed change
- draft a command for admin review
- say which role is required

## Why Was I Denied?

Use this quick debug flow:

1. Confirm the user actually reached the bot.
2. Resolve the app role.
3. Resolve the agent role.
4. If the user is app `owner` or app `admin`, treat agent-admin checks as allowed.
5. Otherwise, check whether the resolved agent role includes the required permission.
6. If the request is trying to mutate protected clisbot control resources through normal, queue, steer, or loop delivery, apply the protected prompt rule as well.

Typical outcomes:

- not admitted yet:
  pairing or routing issue
- admitted but denied:
  auth role issue
- admitted and role should allow:
  implementation bug or wrong permission mapping

## Unsupported Old Config

Operator rule:

- do not use `privilegeCommands` in new configs
- manage routed privileges through `app.auth` and `agents.<id>.auth`

## Phase Roadmap

### Phase 1

- `app.auth` and `agents.<id>.auth`
- owner claim
- phase-1 default `member` permissions
- protected prompt rule shared by normal, queue, steer, and loop delivery
- admin-owned `shellExecute`

### Later

- finer-grained permission splits if product pressure appears
- control CLI enforcement
- runner-side blocking if justified

## Operator Checklist

When this slice ships, a clean rollout should look like this:

1. Start the runtime with no existing owner.
2. Claim the first owner from a DM during the claim window.
3. Add any extra app admins.
4. Confirm owner/admin principals bypass pairing.
5. Confirm unlisted routed users still fall back to agent `member`.
6. Confirm `member` has the intended default controls.
7. Confirm `/bash` is denied until `shellExecute` is granted.
8. Confirm the protected prompt rule applies to normal, queue, steer, and loop delivery.

## Related Pages

- [User Guide](README.md)
- [Channel Operations](channels.md)
- [App And Agent Authorization And Owner Claim](../features/auth/app-and-agent-authorization-and-owner-claim.md)
- [App And Agent Authorization And Owner Claim Task](../tasks/features/auth/2026-04-14-app-and-agent-authorization-and-owner-claim.md)
