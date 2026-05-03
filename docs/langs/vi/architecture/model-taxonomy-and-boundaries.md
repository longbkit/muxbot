[English](../../../architecture/model-taxonomy-and-boundaries.md) | [Tiếng Việt](./model-taxonomy-and-boundaries.md)

# Phân loại model và boundary

## Trạng thái

Tài liệu tham chiếu kiến trúc đang áp dụng

## Mục đích

Tài liệu này định nghĩa cách các model trong repository nên được đặt tên, tách ranh giới, và tiến hóa theo thời gian.

Mục tiêu của nó là chặn một kiểu hỏng kiến trúc rất thường gặp ở giai đoạn đầu:

- trộn auth policy, state của tầng agents, runner contracts, channel payloads, control payloads, persistence records, và transient runtime state vào cùng một object shape

Khi chuyện đó xảy ra, codebase sẽ mơ hồ theo những cách rất đắt về sau:

- channel contract trở nên không ổn định
- control flow bắt đầu phụ thuộc vào backend field mang tính tình cờ
- optional field bắt đầu đại diện cho hidden loading state
- validation yếu dần theo thời gian
- công việc sync và cộng tác thừa hưởng các boundary về ownership không rõ ràng

## Quy tắc cốt lõi

Không được định nghĩa một model chỉ bằng tập thuộc tính của nó.

Mỗi model đủ quan trọng phải được định nghĩa bởi toàn bộ các mặt sau:

1. vai trò
2. ownership
3. lifecycle
4. invariants
5. boundary được phép đi qua

## Phân loại

### 1. Agent entities

Agent entities mô tả operating truth mang tính canonical của hệ thống.

Chúng phải trả lời được:

- trong operating model của agent có những gì
- agents, sessions, workspaces, tools, skills, memory, và subagents liên hệ với nhau ra sao
- mutation nào thật sự có ý nghĩa

Agent entities không tự động đồng nghĩa với channel DTO, persistence row, hay operator view.

### 2. Persistence model

Persistence model mô tả những gì backend lưu một cách durable.

Chúng nên có các tính chất:

- deterministic
- có version khi cần
- dễ migration
- explicit về canonical ownership

Không được đưa transient runtime concern vào persistence shape.

### 3. Surface contracts

Surface contracts định nghĩa những gì được đi qua channel boundary hoặc control boundary.

Chúng không cần mirror persistence shape một cách máy móc.

Surface contracts phải explicit về:

- field nào được đảm bảo
- field nào bị lược bỏ có chủ đích
- payload đó là raw session scope, cleaned conversation scope, hay control scope

### 4. Projections và summaries

Projection là read-oriented shape được suy ra từ canonical data để phục vụ một use case cụ thể.

Quy tắc cho projection:

- projection không phải canonical truth
- projection có thể cố ý lặp lại derived value
- projection không bao giờ được âm thầm thay thế entity model gốc

### 5. Runner runtime state

Runner runtime state là local state cần để việc thực thi dùng được, nhưng không phải canonical truth.

Ví dụ:

- current snapshot cache
- inflight stream state
- backend connection state
- transient trust-prompt state

Runner runtime state phải tách khỏi:

- persistence shape
- channel DTOs
- agent entities

## Quy tắc boundary

### Auth và agents

Auth policy không được nhập vào agent entity shape, trừ khi policy đó được agent layer thật sự sở hữu.

Ví dụ:

- quyền xem một transcript không nên tự nhiên trở thành field thuộc session entity
- route admission policy không nên được nhét vào runner state

### Runners và channels

Runner output không nên tự nhiên trở thành user-facing channel payload.

Thay vào đó:

- runners xuất backend truth đã chuẩn hóa
- channels render theo surface contract tương ứng

### Control và product surfaces

Operator-facing control payload không nên âm thầm tái sử dụng channel-facing payload chỉ vì chúng nhìn “gần giống”.

Control view và user-facing view có thể đọc cùng canonical entity, nhưng contract của chúng khác nhau.

## Quá trình tiến hóa model

Khi một model cần đổi:

1. xác định model hiện tại đang thuộc loại nào trong taxonomy này
2. xác định owner boundary thật sự
3. quyết định thay đổi đó thuộc entity, persistence, surface contract, hay projection
4. chỉ sau đó mới đổi field hoặc đổi tên

Nếu không làm theo trình tự đó, việc refactor thường chỉ đổi chữ mà không làm rõ được boundary.

## Câu hỏi kiểm tra

Khi review một model, hãy hỏi:

1. object này đang đại diện cho truth nào?
2. ai sở hữu việc mutate truth đó?
3. nó sống bao lâu?
4. field nào là canonical, field nào chỉ là derived?
5. payload này có đang đi qua một boundary không nên đi qua hay không?

Nếu không trả lời rõ được, model đó vẫn chưa đủ sạch.
