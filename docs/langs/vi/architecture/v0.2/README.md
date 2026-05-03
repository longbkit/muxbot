[English](../../../../architecture/v0.2/README.md) | [Tiếng Việt](./README.md)

# Kiến trúc v0.2

Folder này là một bài tập kiến trúc kiểu clean-slate, chỉ xuất phát từ:

- [docs/overview/human-requirements.md](../../overview/human-requirements.md)

Nó **cố ý không** dùng phần còn lại của repository docs làm đầu vào thiết kế.

Mục tiêu là tổng hợp lại kiến trúc từ human requirements trước, rồi mới hội tụ về một model đơn giản hơn và truthful hơn.

## Các file

- `01-five-candidates.md`
  Năm phương án kiến trúc khác nhau, chỉ xây từ human requirements.
- `02-shortlist-and-iterations.md`
  Các yếu tố ra quyết định, shortlist, ghi chú iteration, và logic hội tụ.
- `03-component-flows-and-validation-loops.md`
  Luồng giao tiếp giữa các layer, cách kiểm tra lại với raw requirements, và các vòng tinh chỉnh lặp.
- `04-layer-function-contracts.md`
  Canonical glossary, naming rules, và function contract theo từng layer bám theo kiến trúc cuối cùng.
- `05-architecture-notes-and-faq.md`
  Ghi chú đi kèm cho các quyết định ngầm, notice, cách hiểu raw requirements, và FAQ khi review.
- `06-state-machines.md`
  Tách bạch canonical giữa queue state, session runtime state, và active run state.
- `final-layered-architecture.md`
  Thiết kế cuối cùng gói trong 1-2 trang: layers, owners, placement rules, và FAQ.

## Thứ tự nên đọc

- Đọc `01` và `02` nếu muốn hiểu lịch sử khám phá.
- Đọc `final-layered-architecture.md`, `03`, và `04` nếu muốn lấy model đã hội tụ.
- Đọc `05` khi muốn hiểu vì sao model này ra đời, không chỉ xem mỗi model.
- Đọc `06` khi review naming của lifecycle, transitions, và state ownership.

## Quy tắc xác minh cho pass v0.2 này

Pass này xác minh ý tưởng dựa trên yêu cầu trong `human-requirements.md`, không xác minh dựa trên docs cũ hơn.

Điều đó nghĩa là:

- requirement coverage là thứ quan trọng
- độ rõ của mental model là thứ quan trọng
- độ rõ của owner boundary là thứ quan trọng
- việc reconcile lại với code / docs hiện có là bước khác về sau
