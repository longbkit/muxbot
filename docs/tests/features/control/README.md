# Control Tests

## Purpose

These test cases define the operator-facing control surface for inspecting and recovering the system.

They should stay separate from end-user channel behavior.

## Test Case 1: Operator Can Discover And Inspect A Live Runner Session

### Preconditions

- a runner-backed session for agent `default` is active

### Steps

1. Run `clisbot runner list`
2. Run `clisbot runner inspect <session-name> --lines 40`
3. Run `clisbot runner watch <session-name> --lines 20 --interval 1s`

### Expected Results

- the operator can discover the active session without raw tmux commands
- inspect shows one truthful pane snapshot for the selected tmux session
- watch polls the same pane continuously with the configured tail window

## Test Case 1A: Operator Can Watch The Latest Or Next Admitted Prompt

### Preconditions

- at least one conversation has already admitted a prompt
- the operator may want to start watching before the next test prompt is sent

### Steps

1. Run `clisbot runner watch --latest --lines 20 --interval 1s`
2. Stop it and run `clisbot runner watch --next --timeout 120s --lines 20 --interval 1s`
3. Send one new prompt from a routed surface while the second watch command is waiting

### Expected Results

- `watch --latest` selects the session with the newest admitted prompt, not the newest tmux spawn
- `watch --next` attaches to the first newly admitted prompt after the command starts
- once `watch --next` selects a session, it stays on that session instead of flapping to later traffic

## Test Case 2: Operator Can Restart A Broken Session Safely

### Preconditions

- a session is stuck, unhealthy, or no longer responding to prompts

### Steps

1. invoke the documented operator restart path for the affected agent
2. send a new prompt after the restart completes

### Expected Results

- the restart path targets only the intended agent session
- stale runner state is cleared
- the agent returns to a usable state without requiring undocumented manual cleanup

## Test Case 3: Health View Distinguishes Channel, Agent, And Runner Failure

### Preconditions

- observability or status output is available

### Steps

1. inspect health for a working session
2. inspect health for a case where the channel is disconnected
3. inspect health for a case where the runner is present but the agent is blocked

### Expected Results

- health output distinguishes channel connectivity, agent state, and runner state
- operators can identify the failing layer without attaching blindly
- the control surface exposes actionable state instead of forcing log forensics first

## Test Case 4: Operator Can List Persisted Loops

### Preconditions

- at least one recurring loop already exists from a prior channel `/loop` command

### Steps

1. Run `clisbot loops list`
2. Run `clisbot loops status`

### Expected Results

- both commands succeed without requiring channel token env vars in the current shell
- both commands show the same loop inventory body
- each row includes loop id, agent id, session key, schedule, remaining runs, and next run time

## Test Case 5: Operator Can Cancel One Persisted Loop By Id

### Preconditions

- at least two recurring loops already exist
- one known target loop id is available

### Steps

1. Run `clisbot loops cancel <id>`
2. Run `clisbot loops status`

### Expected Results

- only the targeted loop is removed
- the remaining loop inventory count drops by one
- future ticks for the cancelled loop do not execute again

## Test Case 6: Operator Can Cancel All Persisted Loops

### Preconditions

- at least one recurring loop already exists

### Steps

1. Run `clisbot loops cancel --all`
2. Run `clisbot loops status`

### Expected Results

- all persisted loops are removed across the app
- `clisbot loops status` reports zero active loops
- no later recurring tick appears from those cancelled loops
