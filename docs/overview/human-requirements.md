# Human Requirements

## Status

Raw human input. Preserve as given.

## Rule

Do not modify this file unless a human explicitly asks for this file to be updated.

Do not normalize, summarize, restructure, or clean up the content here on your own.

## Notes

Add raw human requirements, pasted messages, rough constraints, and direct source notes below this line.

---

2026-04-04 human brief:

AI CLI coding tools like Codex or Claude are top agentic AI tools / AI agents on the market. Plus, they have subscription models with API costs that are much cheaper, up to 20x cheaper when using GPT Pro or Claude Max subscriptions (the weekly limit is around 5x the subscription price, which is $200/month, and this weekly limit resets every week, so basically users have 4 times per month, so 4*5 = 20x). What if we can expose these tools to communication channels easily like what OpenClaw did, such as Telegram, Slack, Discord, ... and also via API (completion API compatible)? Codex and Claude both have agent SDKs, but for Claude it is unclear whether its agent SDK is allowed to be used with a subscription or not, while Codex is still good until now. So those SDKs are a good option, but do not depend on them. This project idea is based on tmux scalability and stability: each tmux session can run one AI coding CLI as an agent. These agents can talk back just by giving them a CLI tool to talk through different channels, or they can also stream full tmux content back if that is what the user wants.

What is interesting is that this should also be an experimental project about performance. We want to compare performance between TypeScript with Bun, Go, and Rust, and see how performance and stability can differ. So this project should maybe be organized as a monorepo, with different implementations. For the MVP, I want to focus on Slack WebSocket + tmux + TypeScript + Bun first. Similar to OpenClaw, each Slack channel or bot can be mapped to an agent, meaning a tmux session. So when a user tags the Slack bot, send the direct message to the corresponding tmux session (maybe mapped by tmux session name). Each tmux session should live inside a workspace folder, similar to OpenClaw, which could be `~/.clisbot/workspace/` as a default workspace.

For the MVP, I want you to support `~/.clisbot/clisbot.json` with a similar structure to an OpenClaw-style config template, so that I can start sending messages from Slack when tagging the bot, and the bot in the tmux CLI receives the prompt, executes it, and streams the result back on the go.

Invoke high-skill teams to work on this autonomously for high output quality, and make sure it is well tested with the Slack bot info in `.env`.

You can use the `slack-cli` skill to test yourself whether the message is sent correctly and stably or not.

Autonomous, long session, prefer high quality, completeness, no workaround mode.

2026-04-10
This project has been renamed from tmux-talk, to muxbot, to clisbot

## Architecture
### Update on architecture as of April 16th, 2026

#### Session / Conversation
- Session = a conversation context. It has a session key that is standardized in our system, then mapped to a session id in CLI tools.
- A session at a time maps to only one session id to work with, but it can link to multiple session ids. For example, in a thread chat, a user can use `/new` to start a new conversation, and it then maps to a new session id. Or when it fails to load a previous session id, it might create a new conversation, aka a new session id.
- Compaction still keeps the same session id.
#### Chat surface / Chat route
- Chat surface or chat route: where a conversation happens and continues. A Slack channel has two different chat surfaces depending on the user setting. If they prefer replies in the channel, with no thread, then the channel is the chat surface. But if they prefer replies inside a thread, then that thread is the chat surface.
- For Telegram, we have group and topic concepts. When there is no topic, then the group is the chat surface. With topics, then topics are the chat surfaces.

#### Runner
- Runner = executor, where it invokes a tmux session and runs a CLI tool in a tmux window. A runner is a raw interface for interacting with an AI agent. In cases where an AI agent exposes its interface through an API, it could execute through the API instead. From an API view, we might have OpenAI Completion API compatibility, with conversation ids, streaming support, or long polling / webhooks to receive responses.
- A runner might have a session id as input (if already known, or if the server supports client-generated ids), a prompt, and output a response or streaming response.
- But a runner might also be a different, more complicated thing, such as the Claude Agent SDK or Codex SDK.
- ACP - Agent Client Protocol is also close to the runner concept.
- We might want to breakdown Runner to multiple layers. Think standard REST API request flow: <client> - <executor - HTTP Request> - <network - TCP connection> - <rest API> - <server>

In short, chat completion, the Claude Agent SDK, and Agent Client Protocol are all related. They are somehow the same concept, and somehow a new concept, that makes up the runner.

#### Manager
- When we have multiple objects of the same kind, we might need a manager. That is when we might need to introduce `SessionManager` and `RunnerManager`.
- To cap the maximum number of runners at a time, we need `RunnerPool`. Too many runners can cause memory overhead, CPU overload, or cost / LLM quota usage to run out of control.

#### State machine
- The runner needs a state machine to update its caller.

#### Other objects
- For each session, we may have a queue, but in a more advanced form compared to a CLI prompt queue.
- With a CLI prompt queue, all pending items in the queue get submitted for processing when it comes to the next step in the deep agent process.
- With our session prompt queue, we would rather have it process one by one, without affecting each other. This helps in many cases where each step should happen after the previous step, such as code review after coding, or running tests after coding. Think of it like a sequential workflow.
- For the traditional queue concept, we map it to a steering concept, where the prompt is pushed directly onto the running session / turn to affect the current run / turn / execution.
- Thinking more broadly, we might also have queues that are independent of a session, like a Kanban task. In that case, each item in the queue could be executed in a new session. It would be like a backlog of items, which could be parallel or sequential. For this, the backlog concept might resonate better.
- We have loops, which are a special kind of prompt: a repeated prompt. This repeated prompt could be injected into a specific session, such as to prevent AI laziness, where it keeps injecting "continue doing your work" every time the AI stops. Or it could also invoke a new / fresh session to run the prompt.
- Since we have many queue items and loop items, we may need a manager. But we may also just need a list concept, or not. What I mean by that is, for example, a queue in its simplest form is just a queue object of prompts that belongs to a session (different from a full backlog). For loops, we would have a list of loop items, but each loop item can generate many prompts at different times.
- When a loop belongs to a session, then a session may have a list of loops. This list of loops in turn can generate prompt injection at any time into the session. It can inject in steering mode, or in queue mode. By default, queue mode is best, as it makes sure it does not affect the run in the middle.
- When a loop is not bound to a session, then we have another list of generic / global loops. This list in turn can generate many prompts. These could be run in parallel, following runner pool mode (to cap the max items that run at a time for management purposes). At this point in the thinking, we come back and add another concept, which is runner pool.
