[English](../../../../architecture/v0.2/04-layer-function-contracts.md) | [Tiếng Việt](./04-layer-function-contracts.md)

# Function contract theo layer

Source of truth:

- [docs/overview/human-requirements.md](../../overview/human-requirements.md)
- [docs/architecture/v0.2/final-layered-architecture.md](./final-layered-architecture.md)
- [docs/architecture/v0.2/03-component-flows-and-validation-loops.md](./03-component-flows-and-validation-loops.md)

File này đóng băng contract surface hướng tới implementation.

Mục tiêu:

- một glossary
- một naming style
- một owner cho mỗi function

## 1. Canonical glossary

| Thuật ngữ | Nghĩa |
| --- | --- |
| `Surface` | nơi input đi vào và reply được render |
| `SurfaceRoute` | địa chỉ cụ thể trên một surface |
| `Session` | một conversation do hệ thống sở hữu |
| `sessionKey` | stable identity phía hệ thống của conversation |
| `sessionId` | runner-side conversation handle active hiện tại |
| `Run` | một execution active cho một prompt |
| `RunState` | active-run state machine |
| `Runner` | executor boundary |
| `Workload` | công việc mới nằm ngoài một active session |

## 2. Naming rules

- một concept chỉ có một danh từ
- một owner chỉ có một prefix
- không dùng synonym nếu glossary đã có từ
- đừng dùng cùng một động từ cho hai meaning khác nhau ở các layer khác nhau

Prefix canonical theo layer:

- `surface*`
- `session*`
- `run*`
- `runner*`
- `backlog*` hoặc `globalLoop*` hoặc `runnerPool*`

## 3. Layer contract

### Surface

| Function | Input | Output | Mô tả |
| --- | --- | --- | --- |
| `surfaceResolveRoute` | `SurfaceMessageInput` | `SurfaceRoute` | Resolve nơi message này thuộc về trên surface hiện tại. |
| `surfaceRenderRunEvent` | `SurfaceRoute`, `RunEvent` | `SurfaceRenderResult` | Render run event ra surface đích. |
| `surfaceRenderStatus` | `SurfaceRoute`, `SurfaceStatusInput` | `SurfaceRenderResult` | Render status / acknowledgement / error ở mức surface. |

Không đặt session continuity hay active-run decision ở đây.

### Session

| Function | Input | Output | Mô tả |
| --- | --- | --- | --- |
| `sessionResolve` | `SurfaceRoute` | `SessionRef` | Resolve route này về conversation hiện tại. |
| `sessionCreate` | `SessionCreateInput` | `SessionRef` | Tạo một conversation hệ thống mới. |
| `sessionRotate` | `SessionRef`, `SessionRotateInput` | `SessionRef` | Giữ cùng `sessionKey` nhưng chuyển sang `sessionId` active mới. |
| `sessionAppendPrompt` | `SessionRef`, `SessionPromptInput` | `SessionQueueResult` | Append một prompt vào session queue. |
| `sessionPullPrompt` | `SessionRef` | `SessionPromptInput \| null` | Trả ra prompt kế tiếp đủ điều kiện để chạy. |
| `sessionAddLoop` | `SessionRef`, `SessionLoopSpec` | `SessionLoopRef` | Đăng ký một loop gắn với một session. |
| `sessionTickLoop` | `SessionLoopRef` | `SessionPromptInput` | Phát ra prompt kế tiếp từ một session-bound loop. |

Không đặt active run hay raw runner protocol ở đây.

### Run Control

| Function | Input | Output | Mô tả |
| --- | --- | --- | --- |
| `runStart` | `SessionRef`, `SessionPromptInput` | `RunRef` | Tạo active run cho prompt kế tiếp. |
| `runResolveCurrent` | `SessionRef` | `RunRef \| null` | Trả active run hiện tại của một session. |
| `runSteer` | `RunRef`, `SteeringInput` | `RunSteerResult` | Chèn direct input vào một run còn steer được. |
| `runApplyRunnerEvent` | `RunRef`, `RunnerEvent` | `RunTransition` | Dịch raw runner fact thành run-state transition. |
| `runSettle` | `RunRef`, `RunSettleInput` | `RunResult` | Đóng run bằng một terminal result. |

Không đặt route decision hay session continuity decision ở đây.

### Runner

| Function | Input | Output | Mô tả |
| --- | --- | --- | --- |
| `runnerOpenSession` | `RunnerSessionRequest` | `RunnerSessionRef` | Mở, attach, hoặc tái dùng một runner-side session. |
| `runnerSubmitPrompt` | `RunnerSessionRef`, `RunnerPromptInput` | `RunnerSubmitResult` | Submit prompt qua native runner protocol. |
| `runnerSubmitSteering` | `RunnerSessionRef`, `SteeringInput` | `RunnerSubmitResult` | Submit steering qua native runner protocol. |
| `runnerReadEvents` | `RunnerSessionRef` | `RunnerEventStream` | Đọc raw facts từ runner boundary. |
| `runnerCloseSession` | `RunnerSessionRef` | `RunnerCloseResult` | Đóng hoặc release runner-side session. |

Không đặt queue, loop, hay session truth ở đây.

### Workload

| Function | Input | Output | Mô tả |
| --- | --- | --- | --- |
| `backlogAdd` | `BacklogItemSpec` | `BacklogItemRef` | Đăng ký công việc có thể chạy trong một fresh session. |
| `backlogPull` | none | `BacklogItemSpec \| null` | Trả ra backlog item kế tiếp đủ điều kiện admit. |
| `globalLoopAdd` | `GlobalLoopSpec` | `GlobalLoopRef` | Đăng ký loop không gắn với một session cụ thể. |
| `globalLoopTick` | `GlobalLoopRef` | `BacklogItemSpec` | Phát ra fresh-session work từ một nhịp của global loop. |
| `runnerPoolAcquire` | `RunnerPoolRequest` | `RunnerPoolLease \| RunnerPoolDenyResult` | Cấp hoặc từ chối capacity cho fresh work. |
| `runnerPoolRelease` | `RunnerPoolLease` | `RunnerPoolReleaseResult` | Trả capacity lại sau khi work settle. |

Không được bypass `Session` hoặc `Run Control` từ đây.

## 5. Allowed hand-offs

| Từ | Sang | Hand-off |
| --- | --- | --- |
| `Surface` | `Session` | `surfaceResolveRoute -> sessionResolve` |
| `Session` | `Run Control` | `sessionPullPrompt -> runStart` |
| `Session` | `Run Control` | `sessionResolve -> runResolveCurrent -> runSteer` |
| `Run Control` | `Runner` | `runnerOpenSession`, `runnerSubmitPrompt`, `runnerSubmitSteering`, `runnerReadEvents` |
| `Runner` | `Run Control` | `RunnerEvent -> runApplyRunnerEvent` |
| `Run Control` | `Surface` | `RunEvent -> surfaceRenderRunEvent` |
| `Workload` | `Session` | backlog hoặc global-loop work đi vào lại qua `sessionCreate` hoặc `sessionResolve` |

Mọi đường ngoài danh sách này nên bị xem là đáng nghi.

## 6. Placement test

| Nếu function chủ yếu quyết định... | Thì đặt nó ở... |
| --- | --- |
| message thuộc về đâu hoặc reply hiện ở đâu | `Surface` |
| các turn còn thuộc cùng một conversation hay không | `Session` |
| prompt có còn đang đợi trong session order hay không | `Session` |
| active run đang starting, running, detached, hay terminal | `Run Control` |
| cách nói chuyện với tmux, API, hoặc SDK | `Runner` |
| fresh work có nên đợi vì áp lực global hay không | `Workload` |

Nếu một function muốn trả lời hai hàng khác nhau, hãy tách nó ra.

## 7. Guardrails

- một concept, một danh từ
- một owner, một prefix
- glossary đã có từ thì không invent synonym mới
- đừng dùng hai động từ khác nhau cho cùng một hành động giữa các layer

## 8. Sanity test

Nếu một function được đề xuất:

- vừa đổi session continuity vừa đổi run lifecycle
- vừa nói về route rendering vừa nói raw runner protocol
- vừa quyết định backlog admission vừa quyết định active steering

thì nó không khớp với kiến trúc này và phải bị tách ra.
