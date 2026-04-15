# Rendering And Command Tests

## Test Case 3: Default Interaction Strips Runner Chrome

### Preconditions

- the mapped runner emits visible header or footer chrome during a prompt

### Steps

1. Send a prompt that produces a multi-step response
2. Observe the streamed updates in the channel
3. Compare the visible channel output with the raw runner transcript if needed

### Expected Results

- the channel shows only new interaction content needed by the user
- repeated top chrome, bottom chrome, and unrelated static frame content are stripped
- the rendered output reads as a seamless chat transcript rather than a full terminal dump

## Test Case 3A: Inbound Files Become Workspace-Local Attachment Paths

### Preconditions

- the routed Slack or Telegram surface supports inbound files
- the mapped agent workspace is writable

### Steps

1. Send a message with one attached file and normal text
2. Inspect the mapped agent workspace
3. Inspect the actual prompt received by the runner if needed
4. Repeat with a file-only message

### Expected Results

- the file is saved under `{workspace}/.attachments/{sessionKey}/{messageId}/...`
- the runner receives the stored file as an `@/absolute/path` mention before the user text
- file-only messages still produce a usable prompt from the attachment path alone
- slash commands are not rewritten into attachment-prefixed prompts

## Test Case 4: Slack Streams Only Meaningful New Content

### Preconditions

- the mapped runner emits multiple intermediate updates for one interaction

### Steps

1. Send a Slack prompt that causes Codex to think for several steps before the final answer
2. Watch each Slack thread update as the runner progresses
3. Compare each Slack-visible update with the underlying normalized runner updates

### Expected Results

- Slack updates appear only when new meaningful content is produced
- unchanged full-screen redraws do not produce new Slack-visible output
- repeated Codex chrome is not re-sent as if it were fresh progress
- the user can follow progress without reading the whole tmux screen each time

## Test Case 5: Streaming Policy Changes Slack Thread Behavior Predictably

### Preconditions

- the channel route supports `streaming: off | latest | all`

### Steps

1. Run one prompt with `streaming: "off"`
2. Run one prompt with `streaming: "latest"`
3. Run one prompt with `streaming: "all"`
4. Compare the Slack thread behavior for each run

### Expected Results

- `off` produces no intermediate streamed replies before the final answer
- `latest` keeps one in-progress reply updated to the latest visible state
- `all` keeps one in-progress reply updated in place while preserving all streamed content in that live reply
- all three modes still preserve the chat-first text shaping rules for content quality
- current runtime note: `latest` and `all` are both accepted and persisted, but the visible preview behavior is still intentionally the same until a later slice refines the distinction

## Test Case 5A: Channels With Edit Support Update The Live Reply Instead Of Posting New Progress Replies

### Preconditions

- the target channel supports message editing
- the channel route uses streaming enabled behavior

### Steps

1. Send a prompt that produces multiple visible intermediate updates
2. Observe the thread while the interaction is still running
3. Compare the number of bot replies before and after completion

### Expected Results

- the channel uses one live bot reply for in-progress streaming instead of posting a new reply for each progress update
- the live reply text changes over time as new output arrives
- completion settles by editing that same live reply when the channel supports it

## Test Case 5B: Telegram Does Not Globally Block Unrelated Conversations

### Preconditions

- Telegram routing is enabled for at least two independent conversation surfaces such as two topics or one DM plus one topic
- one routed agent can be kept busy long enough to observe a second inbound message during processing

### Steps

1. In Telegram conversation A, send a prompt that keeps the runner busy for a noticeable period
2. Before conversation A finishes, send a simple prompt in Telegram conversation B
3. Watch service logs and both Telegram conversations

### Expected Results

- conversation B is accepted while conversation A is still running
- conversation B receives typing or reply feedback without waiting for conversation A to finish
- conversation B reaches its own reply path even though conversation A is still active
- only same-session execution remains serialized; unrelated Telegram conversations do not block each other at channel-ingestion time

## Test Case 6: Slack Settles To One Clean Final Answer

### Preconditions

- default chat-first interaction rendering is enabled

### Steps

1. Send a prompt that causes at least one intermediate update and one final answer
2. Wait until the runner reaches its final settled state
3. Inspect the final visible Slack thread state

### Expected Results

- in-progress noise does not remain as the dominant final user-visible output
- the final thread state shows the clean final answer for that interaction
- any retained progress text remains subordinate to the final answer instead of obscuring it

## Test Case 7: Long Final Answers Reconcile Into Ordered Slack Chunks

### Preconditions

- default chat-first interaction rendering is enabled
- the interaction produces enough progress logs and final answer text to exceed the Slack message size cap

### Steps

1. Send a prompt that causes multiple progress updates followed by a long final answer
2. Wait for the final settled Slack reply
3. Compare the final Slack reply with the raw tmux transcript

### Expected Results

- the settled Slack output is preserved across an ordered set of thread replies instead of being truncated into one message
- the first settled chunk starts at the beginning of the final answer rather than in the middle of a sentence
- chunk order stays stable as the live reply is edited
- stale trailing chunks are removed if a later normalized view becomes shorter
- progress-only blocks such as repeated search or tool activity are removed when a cleaner final answer exists

## Test Case 8: Response Policy Controls Whether Streamed Replies Remain Visible

### Preconditions

- the channel route supports `response: all | final`
- the interaction produces at least one streamed intermediate update and one final answer

### Steps

1. Run one prompt with `response: "all"`
2. Run one prompt with `response: "final"`
3. Compare the settled Slack thread state after completion

### Expected Results

- `all` keeps the streamed intermediate replies visible in the thread
- `final` leaves only the final settled reply visible for that interaction
- both policies preserve the same final answer quality rules

## Test Case 8A: Response All Does Not Replay Already-Streamed Content At Completion

### Preconditions

- the channel route uses `streaming: "all"`
- the channel route uses `response: "all"`
- the interaction produces at least one streamed update before the final settled state

### Steps

1. Send a prompt that causes visible intermediate progress and a final answer
2. Wait until the interaction reaches the final settled Slack state
3. Compare the final thread replies in order

### Expected Results

- the final settlement does not repost the same already-streamed answer block again
- if completion adds no new visible content, no duplicate final reply is posted
- if completion adds new visible content, Slack posts only the missing delta rather than replaying the whole answer

## Test Case 9: Explicit Transcript Request Returns Full Session Visibility

### Preconditions

- an explicit transcript request command is enabled for the channel
- at least one prior interaction has already produced visible tmux session content

### Steps

1. In the same Slack thread, invoke the transcript request command pattern
2. Observe the returned Slack-visible transcript response
3. Send another normal prompt after the transcript response

### Expected Results

- the transcript response returns the whole current session view closely enough for inspection
- terminal chrome may be present in the transcript response when it exists in tmux
- the transcript response is clearly separate from normal interaction streaming behavior
- the next normal prompt still returns to meaningful-only chat-first streaming

## Test Case 9A: Reserved Control Slash Commands Take Priority Over Native Agent Slash Commands

### Preconditions

- the routed channel supports normal bot mentions or thread follow-up
- a live agent session exists or can be created

### Steps

1. Send `/transcript` in a valid bot conversation path
2. Send `/stop` in the same path while the agent is busy or immediately after a run
3. Send a non-reserved slash command such as `/model`

### Expected Results

- `/transcript` is handled by clisbot and returns the current full conversation session transcript
- `/stop` sends `Escape` to interrupt current processing in the current conversation session
- reserved control slash commands are not forwarded to the native runner
- non-reserved slash commands are forwarded unchanged to the agent CLI

### Identity Slash Command

1. Send `/whoami` in Slack or Telegram on an allowed route
2. Observe the immediate clisbot reply

Expected:

- the command is handled by clisbot as a reserved control slash command
- Slack replies include sender id, channel id, and thread ts when present
- Telegram replies include sender id, chat id, and topic id when present
- the reply includes the resolved `agentId` and `sessionKey`

## Test Case 9B: Agent Bash Commands Can Be Triggered From The Channel

### Preconditions

- a valid bot conversation path exists
- the routed agent workspace contains a readable git or file state

### Steps

1. Send `/bash pwd`
2. Send `!git diff`
3. Observe the returned channel output

### Expected Results

- `/bash` runs the provided command in the current agent workspace
- `!command` behaves as shorthand for agent-scoped bash execution
- the returned output is the command result, not a forwarded natural-language prompt
- control slash commands still keep higher priority than bash execution commands

## Test Case 9C: Transcript Visibility And Auth Gating Stay Separate

### Preconditions

- one routed conversation exists with `verbose: "off"`
- the resolved role does not include `shellExecute`

### Steps

1. Send `/transcript`
2. Send a configured slash-style transcript shortcut such as `::transcript` or `\transcript`
3. Send `/bash pwd`
4. Send `!git diff`

### Expected Results

- clisbot denies transcript requests with a clear `verbose` policy message
- transcript inspection is not executed while `verbose: "off"` is active
- clisbot denies bash requests with a clear auth message about missing `shellExecute`
- bash execution is not executed
- changing only `verbose` to `minimal` allows transcript requests on the next turn
- granting only `shellExecute` to the resolved role allows bash requests on the next turn

## Test Case 10: Follow-Up Slack Interaction Does Not Repeat Previous Static Chrome

### Preconditions

- one prior Slack interaction has already completed in the same thread
- default chat-first interaction rendering is enabled

### Steps

1. Send a second prompt in the same Slack thread
2. Observe the first streamed update for that new interaction

### Expected Results

- the new interaction does not resend the entire prior Codex frame as though it were new content
- any static session header that remains in the tmux pane is suppressed from Slack unless it changes meaningfully
- the first user-visible update for the new interaction reflects the new work rather than old pane residue

## Test Case 11: API Channel Streams A Compatible Response

### Preconditions

- the API channel is enabled
- at least one agent is configured

### Steps

1. Send a minimal compatible request asking for `Reply with exactly PONG and nothing else.`
2. Repeat with streaming enabled and a prompt that takes long enough to emit intermediate progress

### Expected Results

- the request is accepted through the configured API channel
- the request maps to a configured long-lived agent instead of a disposable one-off process
- the non-streaming response returns `PONG`
- the streaming response emits ordered incremental updates and terminates cleanly
