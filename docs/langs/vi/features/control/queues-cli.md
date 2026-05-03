[English](../../../../features/control/queues-cli.md) | [Tiếng Việt](./queues-cli.md)

# Queues CLI

`clisbot queues` là control surface hướng tới operator cho durable one-shot queued prompt.

Nó dùng cùng routed session model với loop creation: operator chỉ định một Slack hoặc Telegram surface, rồi clisbot lưu queued prompt dưới session entry tương ứng.

## Commands

- `clisbot queues list`
- `clisbot queues list --channel telegram --target group:-1001234567890 --topic-id 4335`
- `clisbot queues status`
- `clisbot queues create --channel telegram --target group:-1001234567890 --topic-id 4335 --sender telegram:1276408333 review backlog`
- `clisbot queues clear --channel telegram --target group:-1001234567890 --topic-id 4335`
- `clisbot queues clear --all`

## Contract

- `list` chỉ hiện pending queued prompt.
- `status` hiện cả pending lẫn running queued prompt.
- `clear` chỉ xóa pending prompt, không interrupt prompt đang chạy.
- `create` dùng đúng routed addressing shape như `loops create`, nên cần explicit `--channel/--target`.
- `create` bắt buộc có `--sender <principal>`.
- `create` bị chặn bởi `control.queue.maxPendingItemsPerSession`, mặc định là `20` nếu config bỏ trống.
- `create` sẽ post một surface acknowledgement có thể nhìn thấy được sau khi persist xong, dùng cùng wording về queue position như `/queue` và kèm full prompt đã submit:
  - `Queued: 2 ahead. Prompt: ...`
- `--current` cố ý không được hỗ trợ, vì operator CLI sống ngắn và không có ambient current surface đáng tin.

## Persistence

Queue state được lưu trong session store hiện có:

```text
session.storePath
  -> Record<sessionKey, StoredSessionEntry>
  -> StoredSessionEntry.queues?: StoredQueueItem[]
```

Mảng `queues` đã lưu là canonical queue inventory cho `/queue list`, `/queue clear`, và `clisbot queues`.

Runtime sẽ hydrate pending item từ đây vào cùng ordered drain mà `/queue` dùng, để `positionAhead`, active-run idle guard, lazy prompt rebuild, start notification, và cleared-pending settlement đều đi cùng một queue contract.

CLI chỉ persist queue item, không tự thực hiện prompt delivery. Nếu runtime đang chạy, item pending đã persist sẽ được reconcile vào runtime drain. Nếu runtime đang dừng, queued prompt sẽ kích hoạt ở lần `clisbot start` kế tiếp.

Persisted `running` queue item sẽ được giữ lại khi session vẫn có active run đang chặn. Một khi reconcile thấy session đã idle, clisbot phải bỏ stale running queue item đó đi thay vì để nó chặn prompt mới.

## Addressing

Ví dụ Telegram nên dùng route-style target:

- `--channel telegram --target group:-1001234567890 --topic-id 4335`
- `--channel telegram --target topic:-1001234567890:4335`

Ví dụ Slack:

- `--channel slack --target group:C1234567890`
- `--channel slack --target group:C1234567890 --thread-id 1712345678.123456`

## Tests

- `test/queues-cli.test.ts`
- `test/session-state.test.ts`
- `test/job-queue.test.ts`
- `test/interaction-processing/interaction-processing.test.ts`
