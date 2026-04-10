# Agent Progress Replies

## Purpose

Use this page when you want to test the chatbot flow where Codex or Claude sends short progress updates back to Slack or Telegram while it is still working.

## What muxbot Does

Current local developer flow has three parts:

1. `muxbot` creates a stable local wrapper at `~/.muxbot/bin/muxbot`
2. runner-launched agent sessions get that wrapper path exported during startup
3. Slack and Telegram prepend a short hidden system block to the agent-bound prompt with the exact reply command for the current conversation

That means the agent can be running inside another workspace and still send progress updates with a machine-local command that does not depend on its current working directory.

## Fastest Test Flow

Start muxbot normally:

```bash
bun run start --cli codex --bootstrap team-assistant
```

Then:

1. send a real human message in the configured Slack or Telegram test surface
2. let muxbot route that message to the configured agent
3. the agent prompt now includes the exact local reply command for that conversation
4. the agent can send progress updates and the final reply through `muxbot message send ...`

Preferred reply pattern for multi-line or quote-heavy content:

```bash
~/.muxbot/bin/muxbot message send \
  --channel slack \
  --target channel:C1234567890 \
  --thread-id 1712345678.123456 \
  --message "$(cat <<'__MUXBOT_MESSAGE__'
working on it

step 1 complete
__MUXBOT_MESSAGE__
)"
```

## Important Rules

- send a real human message to trigger the flow
- do not try to simulate the inbound user turn with `muxbot message send ...`
- the wrapper path is stable on the local machine: `~/.muxbot/bin/muxbot`
- use normal ASCII spaces when copying shell examples
- the injected prompt tells the agent to keep progress updates short
- current prompt policy defaults are:
  - at most `3` progress messages
  - exactly `1` final response

## Why The Wrapper Exists

Agent sessions do not run in the `muxbot` repo root.

So repo-local commands such as:

```bash
bun run src/main.ts message send ...
```

are poor runtime instructions for the agent.

The local wrapper fixes that by always pointing back to the active local `muxbot` checkout.

## Config

Slack and Telegram now expose a small prompt policy block:

```json
"agentPrompt": {
  "enabled": true,
  "maxProgressMessages": 3,
  "requireFinalResponse": true
}
```

If you disable `agentPrompt.enabled`, muxbot stops injecting the reply instruction block into agent-bound prompts for that provider.

User-visible reply delivery is configured beside `streaming` and `response`:

```json
"streaming": "off",
"response": "final",
"responseMode": "message-tool"
```

- `capture-pane`: existing muxbot behavior. The channel posts progress or final settlement from normalized runner output.
- `message-tool`: muxbot still captures and observes the runner pane for state, but normal progress and final reply delivery are expected to happen through `muxbot message send ...` from the agent prompt flow.

Use `message-tool` when you want to avoid duplicate replies or raw pane-derived final settlement while still keeping tmux observation available for status, attach, watch, and internal runtime logic.

## Response Mode Precedence

Resolved `responseMode` now follows one order:

1. surface override
2. agent override
3. provider default
4. built-in default `message-tool`

That means muxbot still captures the pane in every case, but decides whether user-visible delivery comes from pane settlement or from `muxbot message send ...` using the first configured match above.

Top-level Slack example:

```json
"channels": {
  "slack": {
    "agentPrompt": {
      "enabled": true,
      "maxProgressMessages": 3,
      "requireFinalResponse": true
    },
    "streaming": "off",
    "response": "final",
    "responseMode": "message-tool"
  }
}
```

Slack channel override example:

```json
"channels": {
  "slack": {
    "streaming": "off",
    "response": "final",
    "responseMode": "message-tool",
    "channels": {
      "C1234567890": {
        "requireMention": true,
        "responseMode": "capture-pane"
      }
    }
  }
}
```

Telegram group and topic override example:

```json
"channels": {
  "telegram": {
    "streaming": "off",
    "response": "final",
    "responseMode": "message-tool",
    "groups": {
      "-1001234567890": {
        "requireMention": false,
        "responseMode": "capture-pane",
        "topics": {
          "42": {
            "responseMode": "message-tool"
          }
        }
      }
    }
  }
}
```

Interpretation:

- top-level `responseMode` is the provider default
- `agents.list[].responseMode` overrides the provider default for that one agent
- a Slack channel route can override it per channel
- a Telegram group can override it per group
- a Telegram topic can override the parent group again for that one topic

Agent override example:

```json
"agents": {
  "list": [
    {
      "id": "default",
      "responseMode": "message-tool"
    },
    {
      "id": "reviewer",
      "responseMode": "capture-pane"
    }
  ]
}
```

## Operator Commands

Channel or surface response-mode status:

```bash
muxbot channels response-mode status --channel slack
muxbot channels response-mode status --channel slack --target channel:C1234567890
muxbot channels response-mode status --channel slack --target group:G1234567890
muxbot channels response-mode status --channel slack --target dm:D1234567890
muxbot channels response-mode status --channel telegram --target -1001234567890
muxbot channels response-mode status --channel telegram --target -1001234567890 --topic 42
muxbot channels response-mode status --channel telegram --target 123456789
```

Channel or surface response-mode updates:

```bash
muxbot channels response-mode set message-tool --channel slack --target channel:C1234567890
muxbot channels response-mode set capture-pane --channel slack --target group:G1234567890
muxbot channels response-mode set message-tool --channel slack --target dm:D1234567890
muxbot channels response-mode set message-tool --channel telegram --target -1001234567890
muxbot channels response-mode set capture-pane --channel telegram --target -1001234567890 --topic 42
muxbot channels response-mode set message-tool --channel telegram --target 123456789
```

Agent response-mode status and updates:

```bash
muxbot agents response-mode status --agent default
muxbot agents response-mode set message-tool --agent default
muxbot agents response-mode clear --agent reviewer
```

Status surfaces:

- `muxbot status` shows provider-level `responseMode` for Slack and Telegram plus any per-agent override in the agent summary.
- `/status` shows the active route `responseMode` for the current conversation.
- `/responsemode status` shows the active route value plus the current persisted surface target value.
