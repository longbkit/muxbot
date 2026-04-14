# Authorization Tests

## Purpose

These test cases define the expected behavior of the auth system.

They should prove the permission model itself, not only the storage shape and not only one consuming surface.

## Test Case 1: Owner Claim Opens Only When No Owner Exists

### Preconditions

- `app.auth.roles.owner.users` is empty
- the runtime has started

### Steps

1. Send the first successful DM during the claim window.
2. Restart the runtime.
3. Send another DM from a different user.

### Expected Results

- the first DM user becomes owner
- restart does not reopen claim while an owner still exists
- the second user does not silently become owner

## Test Case 2: Agent Role Falls Back To Member

### Preconditions

- an agent has `defaultRole: "member"`
- one routed user is not listed in any agent role

### Steps

1. Send a normal routed message from that user.
2. Attempt one action reserved for a stronger role.

### Expected Results

- the user can use the intended member actions
- the privileged action is denied clearly

## Test Case 3: Route-Local Privilege Rule Still Narrows Bash

### Preconditions

- one user has an agent role that allows `bash`
- the route-local `privilegeCommands.mode` is narrower than the role grant

### Steps

1. Attempt `/bash ...` from that route.

### Expected Results

- route-local restriction still wins
- the denial is clear and does not imply the role itself is missing

## Test Case 4: Prompt Auth Context Matches Runtime Permission Truth

### Preconditions

- one routed user lacks config-mutation permission

### Steps

1. Inspect the rendered auth block for that user.
2. Attempt a config-mutating request through normal chat.

### Expected Results

- the prompt shows the correct current app role and agent role
- the prompt states that config mutation is not allowed
- runtime and prompt do not disagree about that denial
