[English](../../../overview/prioritization.md) | [Tiếng Việt](./prioritization.md) | [简体中文](../../zh-CN/overview/prioritization.md) | [한국어](../../ko/overview/prioritization.md)

# Lăng kính ưu tiên

## Mục đích

Trang này định nghĩa lăng kính ưu tiên công việc hiện tại cho `clisbot`.

Hãy dùng nó khi:

- quyết định task nào nên là `P0`
- quyết định việc nào nên được đẩy lên trước trong `docs/tasks/backlog.md`
- rà xem một task là công việc chiến lược của sản phẩm hay chỉ là đánh bóng cục bộ

## Quy tắc cốt lõi

Ưu tiên các việc khiến `clisbot` trở nên:

- ổn định hơn
- nhanh hơn
- dễ mở rộng thêm backend CLI mới hơn
- dễ mở rộng thêm kênh giao tiếp mới hơn
- tự nhiên và hữu ích hơn trong các ngữ cảnh chat thật
- dễ kiểm chứng end-to-end hơn
- dễ để các AI agent dùng và cải thiện ngay trong repo này hơn

Nếu một task chỉ cải thiện một điểm theo cách cục bộ, nó vẫn có thể quan trọng.

Nếu một task cải thiện nhiều điểm cùng lúc, nó thường nên được đẩy lên nhanh.

## Các chủ đề ưu tiên hiện tại

### 1. Độ ổn định và tính đúng sự thật của runtime

Đây vẫn là ưu tiên số một.

`clisbot` là một runtime agent chạy dài hạn, không chỉ là script helper cục bộ.

Vì vậy backlog nên ưu tiên mạnh cho:

- cô lập sự cố
- trạng thái active-run đúng sự thật
- recovery có ranh giới rõ và khả năng tự lành
- các chỉ báo health phản ánh đúng runtime thật
- hành vi của channel và runner không bị suy giảm âm thầm

## 2. Tốc độ và thời gian phản hồi ít ma sát

Tốc độ không phải đồ đánh bóng.

Route chậm, submit chậm, xử lý follow-up chậm, hay trả lời trên kênh chậm đều làm giảm trực tiếp chất lượng sản phẩm.

Backlog nên tiếp tục đẩy vào:

- độ trễ từ channel sang runner
- độ trễ submit
- độ nhạy của follow-up
- tốc độ preview và phản hồi cuối
- tốc độ debug của operator khi có sự cố

## 3. Tích hợp backend CLI mới dễ dàng

Kiến trúc nên khiến việc tích hợp CLI mới rẻ dần theo thời gian.

Điều đó có nghĩa là ưu tiên:

- contract của runner sạch hơn
- ít rò rỉ đặc thù backend ra ngoài ranh giới runner hơn
- kỳ vọng tương thích rõ ràng
- điểm kiểm chứng và smoke test có thể tái sử dụng
- ít giả định ngầm chỉ gắn với Codex, Claude, hoặc Gemini hơn

## 4. Tích hợp kênh giao tiếp mới dễ dàng

Kiến trúc cũng nên khiến việc mở thêm kênh rẻ hơn theo thời gian.

Điều đó có nghĩa là ưu tiên:

- ranh giới plugin cho channel ổn định
- quyền sở hữu rõ ràng giữa transport và rendering của từng channel
- các mẫu route, status, auth, và lifecycle có thể tái sử dụng
- ít giả định rò rỉ kiểu chỉ riêng Slack hoặc chỉ riêng Telegram hơn

## 5. Trải nghiệm chat native trên từng kênh

Slack, Telegram, và các kênh tương lai phải cho cảm giác native, không phải chỉ là ảnh chiếu của terminal.

Điều đó có nghĩa là ưu tiên:

- render native
- follow-up mạnh
- nhận biết thread hoặc topic rõ ràng
- nhắm đúng đích trả lời
- phản hồi xử lý hữu ích
- trải nghiệm hội thoại hợp với kênh thay vì chống lại nó

## 6. Kiểm chứng end-to-end và các hook để AI vận hành được

Project này phải dễ kiểm chứng qua luồng thật end-to-end, không chỉ dựa vào unit test.

Điều đó có nghĩa là ưu tiên:

- luồng test end-to-end
- luồng smoke và canary
- workflow runner-debug ổn định
- capture artifact
- hook ở lớp message hoặc control để AI agent dùng được một cách đáng tin

## 7. Cải thiện chính workflow AI của repo này

`clisbot` nên là một trong những nơi đầu tiên để team cải thiện workflow làm việc cùng AI một cách thực chất.

Điều đó có nghĩa là ưu tiên:

- workflow phản hồi của agent tốt hơn
- vòng lặp review và chống hồi quy tốt hơn
- contract của prompt hoặc command rõ ràng hơn
- tool cục bộ của repo giúp AI làm việc nhanh và an toàn hơn
- docs giúp một AI agent khác tiếp tục được việc mà không phải khám phá lại cả hệ thống

## Heuristic để ưu tiên

Hãy coi một task là ứng viên `P0` mạnh khi nó làm được một hoặc nhiều điều sau:

- loại bỏ rủi ro thật về độ ổn định hoặc tính đúng sự thật
- cải thiện tốc độ ở một đường đi quan trọng của người dùng
- làm cho việc thêm CLI mới dễ hơn rõ rệt
- làm cho việc thêm kênh mới dễ hơn rõ rệt
- cải thiện trải nghiệm chat native trên Slack hoặc Telegram là các ngữ cảnh chat lõi
- tăng đòn bẩy kiểm chứng end-to-end có thể tái sử dụng
- cải thiện workflow AI của repo theo cách làm tăng tốc độ giao hàng về sau

Hãy coi task có mức ưu tiên thấp hơn khi nó chủ yếu là:

- đánh bóng cục bộ với ít đòn bẩy
- đổi tên hẹp mà không làm đơn giản đi thật sự
- workaround một lần rồi làm coupling sâu hơn
- mở rộng suy đoán khi nền móng hiện tại còn chưa đủ chắc

## Cách dùng cùng backlog

- `docs/tasks/backlog.md` vẫn là nguồn sự thật cho trạng thái và ưu tiên.
- Trang này giải thích ưu tiên đó nên được quyết định như thế nào.
- Nếu một task dự kiến đi ngược các chủ đề này, hãy viết lại ghi chú task trước khi kéo nó lên.

## Tài liệu liên quan

- [Overview](README.md)
- [Launch MVP Path](launch-mvp-path.md)
- [Task Docs](../../../tasks/README.md)
- [Backlog](../../../tasks/backlog.md)
- [Stability](../../../features/non-functionals/stability/README.md)
- [DX](../../../features/dx/README.md)
