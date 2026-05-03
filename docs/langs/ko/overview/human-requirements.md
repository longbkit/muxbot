[English](../../../overview/human-requirements.md) | [한국어](./human-requirements.md)

# 인간 요구사항

## 상태

원문 인간 입력입니다. 의미를 보존한 한국어 번역본이며, 원래의 거친 요구사항 성격을 유지합니다.

## 규칙

원문 `docs/overview/human-requirements.md`는 사람이 직접 요청하지 않는 한 수정하지 않습니다.

이 문서는 원문 메모의 한국어 참조판이며, 구조를 임의로 정리하거나 정제하지 않습니다.

## 메모

아래는 원문 인간 요구사항, 붙여 넣은 메시지, 거친 제약, 직접 소스 메모를 한국어로 옮긴 내용입니다.

---

2026-04-04 human brief:

Codex나 Claude 같은 AI CLI coding tool은 시장에서 가장 상위권 agentic AI 도구 / AI agent다. 게다가 subscription 모델을 쓰면 API 비용보다 훨씬 싸게 쓸 수 있다. GPT Pro나 Claude Max 같은 subscription을 쓰면 최대 20배까지 저렴할 수 있다. (주간 한도가 구독료의 약 5배 수준이고, 구독료는 월 200달러, 이 한도는 매주 초기화되므로 한 달에 4번 x 5배 = 20배 정도의 사용량이 나온다.) 만약 OpenClaw가 했던 것처럼 이런 도구를 Telegram, Slack, Discord 같은 커뮤니케이션 채널이나 API(Completion API compatible)로 쉽게 노출할 수 있다면 어떨까? Codex와 Claude 모두 agent SDK를 갖고 있지만, Claude는 subscription과 함께 agent SDK를 써도 되는지 불분명하고 Codex는 지금까지는 괜찮다. 그러므로 SDK는 좋은 선택지지만 거기에 의존하지는 말아야 한다. 이 프로젝트 아이디어는 tmux의 확장성과 안정성 위에 서 있다. 각 tmux session은 하나의 AI coding CLI를 agent처럼 실행할 수 있다. 이 agent들은 서로 다른 채널을 통해 말할 수 있게 해 주는 CLI tool을 넘겨 주기만 해도 응답할 수 있고, 사용자가 원한다면 tmux 전체 내용을 스트리밍해서 되돌려 줄 수도 있다.

또 흥미로운 점은 이 프로젝트가 성능 실험 프로젝트이기도 해야 한다는 것이다. TypeScript + Bun, Go, Rust 사이의 성능을 비교하고, 성능과 안정성이 어떻게 달라지는지 보고 싶다. 그래서 이 프로젝트는 아마 여러 구현을 담는 monorepo 구조가 되어야 할 수도 있다. MVP에서는 우선 Slack WebSocket + tmux + TypeScript + Bun에 집중하고 싶다. OpenClaw와 비슷하게, 각 Slack channel이나 bot을 하나의 agent, 즉 하나의 tmux session에 매핑할 수 있어야 한다. 그래서 사용자가 Slack bot을 태그하면 해당 direct message를 맞는 tmux session(아마 tmux session name으로 매핑될 수도 있음)에 보내고, 각 tmux session은 OpenClaw처럼 workspace folder 안에서 살아야 한다. 기본 workspace는 `~/.clisbot/workspace/` 같은 형태가 될 수 있다.

MVP에서는 `~/.clisbot/clisbot.json`을 OpenClaw 스타일 config template과 비슷한 구조로 지원해 달라. 그래야 Slack에서 bot을 태그했을 때 메시지를 보내고, tmux 안의 bot이 prompt를 받아 실행하고, 이동 중에도 결과를 스트리밍해 돌려줄 수 있다.

고숙련 팀을 불러 자율적으로 작업하게 해서 출력 품질을 높이고, `.env`에 있는 Slack bot 정보로 충분히 테스트해 달라.

메시지가 정확하고 안정적으로 전송되는지 직접 확인하려면 `slack-cli` skill을 사용할 수 있다.

Autonomous, long session, prefer high quality, completeness, no workaround mode.

2026-04-10
이 프로젝트 이름은 tmux-talk에서 muxbot으로, 다시 clisbot으로 바뀌었다.

## Architecture

### 2026-04-16 기준 아키텍처 업데이트

#### Session / Conversation

- Session은 하나의 conversation context다. 우리 시스템에서 표준화된 session key를 가지며, 이것이 CLI tool의 session id에 매핑된다.
- 한 시점의 session은 하나의 session id에만 매핑되어 동작하지만, 시간이 지나며 여러 session id와 연결될 수는 있다. 예를 들어 thread chat에서 사용자가 `/new`를 쓰면 새 대화, 즉 새 session id로 연결된다. 또는 이전 session id를 불러오지 못했을 때 새 conversation을 만들 수도 있다.
- compaction을 해도 같은 session id를 유지한다.

#### Chat surface / Chat route

- Chat surface 또는 chat route는 대화가 일어나고 이어지는 장소다. Slack channel은 사용자 설정에 따라 두 가지 서로 다른 chat surface를 가질 수 있다. thread 없이 channel 안에 바로 reply를 원하면 그 channel 자체가 chat surface다. 반대로 thread 안에서만 reply를 원하면 그 thread가 chat surface다.
- Telegram은 group과 topic 개념이 있다. topic이 없으면 group이 chat surface이고, topic이 있으면 topic이 chat surface다.

#### Runner

- Runner는 실행자다. tmux session을 호출해 tmux window 안에서 CLI tool을 실행한다. runner는 AI agent와 상호작용하기 위한 raw interface다. 어떤 AI agent가 API를 통해 interface를 노출한다면, 그 경우는 API를 통해 실행할 수도 있다. API 관점에서는 OpenAI Completion API compatibility, conversation id, streaming 지원, long polling / webhook 응답 수신 같은 형태도 있을 수 있다.
- runner는 session id 입력(이미 알고 있거나, 서버가 client-generated id를 지원하는 경우), prompt를 받고, response 또는 streaming response를 낼 수 있다.
- 하지만 runner는 Claude Agent SDK나 Codex SDK처럼 더 복잡한 개념일 수도 있다.
- ACP - Agent Client Protocol도 runner 개념과 가깝다.
- Runner는 여러 층으로 더 쪼개고 싶을 수도 있다. 보통 REST API 요청 흐름처럼 `<client> - <executor - HTTP Request> - <network - TCP connection> - <rest API> - <server>`를 떠올릴 수 있다.

짧게 말하면 chat completion, Claude Agent SDK, Agent Client Protocol은 모두 관련된 개념이다. 어느 정도는 같은 개념이고, 어느 정도는 새로운 개념이며, 이 조합이 runner를 이룬다.

#### Manager

- 같은 종류의 객체가 여러 개 있으면 manager가 필요할 수 있다. 그래서 `SessionManager`, `RunnerManager` 같은 개념을 도입할 수 있다.
- 동시에 띄우는 runner 수를 제한하려면 `RunnerPool`이 필요하다. runner가 너무 많아지면 메모리 오버헤드, CPU 과부하, 비용 / LLM quota 폭주가 생길 수 있다.

#### State machine

- runner는 caller에게 상태를 갱신해 주기 위한 state machine이 필요하다.

#### Other objects

- 각 session은 queue를 가질 수 있는데, 단순한 CLI prompt queue보다 더 고도화된 형태가 될 수 있다.
- CLI prompt queue는 다음 deep agent process 단계가 오면 대기 중인 항목을 처리 대상으로 밀어 넣는다.
- 반면 session prompt queue는 서로 영향을 주지 않으면서 하나씩 처리되게 하는 편이 낫다. 이렇게 하면 coding 다음 code review, coding 다음 test처럼 이전 단계 뒤에 이어지는 sequential workflow에 더 잘 맞는다.
- 전통적인 queue 개념은 steering 개념으로 맵핑할 수 있는데, 이 경우 prompt를 현재 실행 중인 session / turn / execution에 직접 밀어 넣어 현재 run에 영향을 준다.
- 더 넓게 보면 session과 독립된 queue, 예를 들면 Kanban task 같은 것도 가질 수 있다. 이런 경우 queue 항목 하나하나는 새 session에서 실행될 수 있다. backlog처럼 볼 수 있고, 병렬일 수도, 순차일 수도 있다.
- loop도 있다. loop는 반복되는 prompt라는 특별한 종류다. 이 반복 prompt는 특정 session에 주입되어 AI laziness를 막는 데 쓰일 수도 있다. 예를 들어 AI가 멈출 때마다 "continue doing your work"를 다시 주입하는 식이다. 또는 매번 새로운 session을 열어 prompt를 실행할 수도 있다.
- queue item과 loop item이 많아지면 manager가 필요할 수도 있다. 아니면 그냥 list 개념만으로 충분할 수도 있다. 예를 들어 가장 단순한 queue는 session에 속한 prompt queue object일 뿐이다. loop는 loop item list가 있고, 각 loop item이 서로 다른 시간에 많은 prompt를 생성한다.
- loop가 session에 속하면 session은 loop list를 가지게 된다. 이 loop list는 아무 때나 session에 prompt injection을 생성할 수 있다. steering mode로도 가능하지만 기본은 queue mode가 낫다. run 도중의 작업에 영향을 덜 주기 때문이다.
- loop가 session에 묶이지 않으면 generic / global loop list가 생기고, 이것도 많은 prompt를 만들 수 있다. 이들은 병렬로도 돌 수 있고, runner pool mode를 따라 동시에 실행되는 개수를 제한할 수도 있다. 여기까지 생각하면 다시 runner pool 개념으로 돌아오게 된다.
