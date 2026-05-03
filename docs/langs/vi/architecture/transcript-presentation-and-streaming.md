[English](../../../architecture/transcript-presentation-and-streaming.md) | [Tiếng Việt](./transcript-presentation-and-streaming.md)

# Transcript presentation và streaming của clisbot

## Thông tin tài liệu

- **Ngày tạo**: 2026-04-04
- **Mục đích**: định nghĩa cách runner output đã chuẩn hóa trở thành channel output mà người dùng nhìn thấy
- **Trạng thái**: kiến trúc đang áp dụng

## Vì sao tài liệu này tồn tại

Sản phẩm cần giữ đồng thời hai sự thật:

- tmux và các runner khác có thể phát ra output đầy tiếng ồn theo kiểu terminal
- người dùng mặc định vẫn nên có trải nghiệm chat sạch, kể cả khi backend là tmux session hay plain shell

Điều đó đòi hỏi một contract rõ ràng giữa `runners` và `channels`.

## Quy tắc boundary

`runners` sở hữu backend capture và normalization.

`channels` sở hữu những gì người dùng thật sự nhìn thấy.

Điều này có nghĩa:

- runner có thể capture raw tmux panes, SDK events, hoặc ACP output
- runner phải chuẩn hóa output đó thành một transcript contract nội bộ
- channel mặc định phải render tương tác bình thường như chat-first streaming
- channel có thể lộ ra một transcript request command riêng khi user hoặc operator muốn inspect toàn bộ session view

Channels không được parse trực tiếp các escape hatch đặc thù của tmux.

Runners không được tự quyết định policy render cuối cùng cho người dùng.

## Thuật ngữ cốt lõi

### Raw transcript

Nội dung session mà backend nhìn thấy trước khi được gọt lại cho người dùng.

Với tmux hiện tại, điều này nghĩa là nội dung lấy từ pane, bao gồm repeated chrome và terminal framing.

### Normalized runner output

Dạng backend-neutral mà runner phát ra cho phần còn lại của hệ thống.

Nó phải giữ execution truth, nhưng bỏ đi các transport detail chỉ backend mới cần hiểu.

### Default interaction rendering

Policy render bình thường mà channel áp lên normalized runner output.

Quy tắc mặc định:

- latest normalized view thắng
- channel nên reconcile bộ live message mà người dùng nhìn thấy từ snapshot normalized mới nhất, thay vì tích lũy delta trong chat mode bình thường
- ẩn repeated chrome, replaceable redraw status, và unchanged frame
- settle mỗi interaction thành một final answer sạch

Hệ quả quan trọng:

- normal chat mode không phải append history mode
- nếu một CLI liên tục redraw `Creating...`, `Doing...`, hoặc tương tự ngay tại chỗ, live Slack reply chỉ nên hiện trạng thái mới nhất nhìn thấy được, không phải danh sách ngày càng dài của mọi lần redraw trước đó
- lịch sử append-style durable nên dành cho transcript hoặc debug path có chủ đích, không dành cho tương tác chat mặc định

Quy tắc transport:

- khi channel hỗ trợ edit message, nên ưu tiên một live reply được edit liên tục cho streaming thay vì post một progress reply mới ở mỗi update
- khi một rendered reply vượt message cap của platform, channel nên reconcile một ordered live chunk set bằng cách edit chunk cũ, thêm chunk mới, và xóa chunk đuôi đã stale
- append-only fallback chỉ dành cho channel không edit được hoặc khi channel chủ đích chọn mô hình transport đó
- transport failure tạm thời trong lúc post, edit, hoặc delete không được tự làm chết active-run supervision; trước hết đây là lỗi delivery của surface
- channel có thể giữ, degrade, hoặc detach một observer theo retryable transport policy, nhưng không được biến lỗi của một observer thành canonical run failure nếu không có quy tắc explicit đã được tài liệu hóa

### Transcript request command

Mẫu command explicit trên channel để xin xem toàn bộ session hay transcript view hiện tại.

Đây không phải interaction mode mặc định.

Nó tồn tại để user hoặc operator inspect full tmux-backed state khi cần, mà không biến tương tác bình thường thành terminal dump.

### Run observer command

Mẫu command explicit trên channel để đổi cách thread hiện tại theo dõi một session đang chạy.

Ví dụ:

- attach live updates vào một active run
- detach một thread khỏi live updates nhưng vẫn nhận final settlement về sau
- watch trạng thái mới nhất theo chu kỳ cho tới khi run hoàn tất

### Runner chrome

Những phần output lặp lại hoặc có tính cấu trúc, có ích cho terminal operator nhưng thường không phải thứ user muốn đọc.

Ví dụ với Codex chạy qua tmux:

- top banner lặp lại
- block header về thư mục và model
- footer hint cố định
- terminal frame redraw lặp đi lặp lại

### Meaningful new content

Nội dung transcript mới thật sự đáng đưa lên cho user trong streaming của tương tác bình thường.

Ví dụ:

- một dòng answer mới được sinh ra
- một progress update làm thay đổi trạng thái của task
- một final result

Không tính:

- header block không đổi
- frame redraw lặp lại
- footer tip y nguyên

## Pipeline

Hệ thống nên chạy theo thứ tự này:

1. runner capture backend state
2. runner phát normalized snapshot và streaming update
3. channel áp default chat-first rendering hoặc explicit transcript request path
4. channel render interaction ra surface đích dựa trên transport capability của channel đó

Với session đang chạy sẵn, pipeline này cũng phải hỗ trợ đổi observer mà không restart run:

1. runner hoặc tầng agents tiếp tục monitor active session
2. command ở channel đổi observer mode cho thread hiện tại
3. channel nhận update theo chế độ live, sparse-detached, hoặc interval từ cùng normalized run state

Cùng một normalized runner output có thể được render khác nhau giữa các channel, hoặc giữa các command pattern khác nhau trong cùng một channel.

## Runner contract tối thiểu để hỗ trợ presentation

Để việc trình bày sạch sẽ có thể hoạt động, runner contract ít nhất phải lộ ra:

- stable session identity
- lifecycle state như starting, ready, busy, blocked, done, hoặc failed
- current snapshot
- ordered output updates
- đủ cấu trúc để phân biệt full-screen redraw với meaningful change
- cách lấy current full session view khi transcript request command explicit yêu cầu
- backend error state khi normalization fail

Contract này phải dùng được cho tmux bây giờ và cả ACP hay SDK runner về sau.

## Default interaction rendering

Default interaction rendering phục vụ chất lượng tương tác thường ngày.

Quy tắc:

- chỉ đưa lên meaningful new content
- ẩn repeated header và footer chrome
- tránh gửi lại unchanged full-screen frame
- trình bày progress và final output thành một cuộc hội thoại mạch lạc

Rendering mặc định vẫn phải giữ truthfulness.

Nó có thể ẩn repeated chrome, nhưng không được ẩn meaningful progress, tool activity, hay failure.

Lựa chọn kiến trúc then chốt ở đây là:

- trong normal chat mode, “meaningful progress” được suy ra từ normalized runner state mới nhất
- channels không nên cố giữ mọi intermediate redraw một khi transport bằng message edit đã sẵn sàng
- với reply dài, channel vẫn tuân theo đúng quy tắc đó bằng cách reconcile một ordered chunk set về latest rendered content

Quy tắc này áp dụng kể cả khi runtime bên dưới là:

- một Codex tmux session
- một Claude tmux session
- một plain bash shell trong tmux

Codex và Claude có thể cần normalization rule khác nhau, nhưng đều phải hội tụ về cùng hành vi ở channel:

- latest normalized chat view thay thế live view trước đó
- replaceable terminal status không bị giữ thành chat history
- final settlement được render từ final normalized snapshot, không phải từ một đống delta tích lũy

## Explicit transcript request commands

Full transcript visibility vẫn nên có, nhưng chỉ khi explicit transcript request command được gọi.

Quy tắc:

- transcript request là opt-in command, không phải default streaming path
- transcript request có thể trả về whole session view hiện tại, kể cả terminal chrome
- transcript request không được làm thay đổi interaction model mặc định cho các prompt bình thường về sau
- transcript request nên hoạt động được cho cả tmux-backed agents lẫn plain shell chạy trong tmux

## Explicit run observer commands

Observer commands cũng là opt-in, nhưng khác với transcript request ở chỗ chúng vẫn nằm trong mô hình chat-first rendering.

Quy tắc:

- observer command không lộ raw tmux transcript theo mặc định
- observer command đổi cách thread hiện tại theo dõi một session đang chạy
- channels có thể hỗ trợ live attach, sparse detach, và interval watch trên cùng active run
- observer identity hiện tại có phạm vi theo thread / routed conversation surface, nên một observer command về sau trong cùng thread sẽ thay thế observer mode trước đó của thread đó
- `detach` là sparse-follow mode, không phải full unsubscribe: nó dừng live updates ở thread đó, có thể vẫn giữ low-frequency progress updates, và vẫn cho phép final settlement quay về đó khi run hoàn tất
- detach một thread khỏi live updates không được âm thầm dừng runner monitoring hay final settlement

## Hệ quả riêng cho tmux

Với tmux runner hiện tại:

- tmux pane capture là concern của runner
- transcript normalization từ pane snapshot là concern của runner
- quyết định Slack user sẽ thấy default interaction output ra sao là concern của channel
- việc phơi bày full session visibility khi transcript request command explicit được dùng là runner capability được channels hoặc control tiêu thụ

tmux runner tuyệt đối không được coi là lớp trải nghiệm cuối cùng của người dùng.

## Hệ quả với cấu hình

Configuration tối thiểu cần diễn đạt được:

- chat-first rendering là hành vi mặc định cho tương tác
- transcript request command pattern theo từng channel khi được bật
- streaming policy theo từng channel route
- safe default cho message update behavior

Configuration không được ép channels phải suy ra rendering rule từ loại backend.

Configuration policy cũng phải tách khỏi channel transport capability:

- `streaming` và `response` định nghĩa content retention và settlement behavior
- việc channel edit một live message hay append nhiều reply là quyết định về capability và UX của channel

Với normal Slack chat mode hiện tại, quyết định transport là cố định:

- dùng edited live replies
- reconcile ordered chunks khi một reply vượt giới hạn platform
- không dùng append-delta accumulation cho normal interaction update

## Chuẩn test

Test cần xác minh:

- default interaction loại được repeated chrome mà không giấu meaningful progress
- explicit transcript request command trả về full session visibility khi được yêu cầu
- normalized runner output đủ cho channels render mà không cần parse riêng cú pháp của tmux
- cùng một runner có thể hỗ trợ truthful cả normal chat-first interaction lẫn explicit full transcript request
