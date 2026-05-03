[English](../../../overview/prioritization.md) | [Tiếng Việt](../../vi/overview/prioritization.md) | [简体中文](../../zh-CN/overview/prioritization.md) | [한국어](./prioritization.md)

# 우선순위 판단 기준

## 목적

이 페이지는 `clisbot`의 현재 작업 우선순위를 어떤 기준으로 판단해야 하는지 정리합니다.

다음 상황에서 사용합니다.

- 어떤 task가 `P0`여야 하는지 판단할 때
- 어떤 작업을 `docs/tasks/backlog.md`에서 먼저 올려야 하는지 판단할 때
- 특정 task가 전략적인 제품 작업인지, 아니면 국소적인 다듬기인지 검토할 때

## 핵심 규칙

`clisbot`을 다음 방향으로 더 좋게 만드는 일을 우선합니다.

- 더 안정적으로
- 더 빠르게
- 새로운 CLI backend를 더 쉽게 붙일 수 있게
- 새로운 채널을 더 쉽게 붙일 수 있게
- 실제 채팅 surface 안에서 더 자연스럽고 더 유용하게
- end-to-end 검증을 더 쉽게 할 수 있게
- 이 repo 안에서 AI agent가 직접 사용하고 개선하기 더 쉽게

어떤 task가 이 중 하나만 국소적으로 개선하더라도 여전히 중요할 수 있습니다.

여러 항목을 동시에 개선한다면 보통 더 빨리 우선순위가 올라가야 합니다.

## 현재 우선순위 주제

### 1. 안정성과 runtime truthfulness

이 항목은 늘 최상단입니다.

`clisbot`은 단순한 로컬 helper script가 아니라 오래 살아 있는 agent runtime입니다.

따라서 backlog는 다음에 강하게 기울어야 합니다.

- 장애 격리
- 사실에 맞는 active-run 상태
- 경계가 분명한 recovery와 self-healing
- 실제 runtime 상태와 맞는 health surface
- 조용히 성능이나 동작이 무너지지 않는 channel / runner 동작

## 2. 속도와 낮은 마찰의 응답 시간

속도는 단순한 polish가 아닙니다.

route가 느리거나, submit이 느리거나, follow-up 처리나 channel 응답이 느리면 제품 품질이 직접 떨어집니다.

따라서 backlog는 계속 다음을 밀어야 합니다.

- channel에서 runner까지의 지연
- submit latency
- follow-up 응답성
- preview와 최종 답변 속도
- 문제가 생겼을 때 operator의 debug 속도

## 3. 새로운 CLI backend를 쉽게 통합하기

아키텍처는 시간이 갈수록 새로운 CLI를 더 싸게 붙일 수 있게 만들어야 합니다.

즉, 다음을 우선해야 합니다.

- 더 깔끔한 runner contract
- runner 경계를 넘어 새어 나가는 backend 전용 가정 줄이기
- 분명한 호환 기대치
- 재사용 가능한 검증 및 smoke surface
- Codex, Claude, Gemini에만 묶인 숨은 가정 줄이기

## 4. 새로운 채널을 쉽게 통합하기

아키텍처는 채널 확장도 시간이 갈수록 더 싸게 해야 합니다.

즉, 다음을 우선해야 합니다.

- 안정적인 channel plugin 경계
- channel이 스스로 소유하는 transport / rendering 경계
- 재사용 가능한 route, status, auth, lifecycle 패턴
- Slack 전용 또는 Telegram 전용 가정이 공유 계층으로 새어 나가는 일 줄이기

## 5. 채널에 맞는 자연스러운 채팅 경험

Slack, Telegram, 그리고 앞으로의 채널은 terminal 미러가 아니라 native한 채팅 경험처럼 느껴져야 합니다.

즉, 다음을 우선해야 합니다.

- native rendering
- 강한 follow-up 동작
- 분명한 thread / topic 인식
- 올바른 답변 대상 지정
- 유용한 처리 중 피드백
- 채널의 대화 습관과 맞는 UX

## 6. End-to-end 검증과 AI가 다루기 쉬운 hook

이 프로젝트는 단위 테스트만이 아니라 실제 end-to-end 흐름으로도 검증하기 쉬워야 합니다.

즉, 다음을 우선해야 합니다.

- end-to-end 테스트 surface
- smoke / canary 흐름
- 안정적인 runner-debug workflow
- artifact 수집
- AI agent가 믿고 사용할 수 있는 message / control hook

## 7. 이 repo 자체의 AI workflow 개선

`clisbot`은 팀이 AI 보조 엔지니어링 워크플로를 실제로 끌어올리는 첫 사례 중 하나가 되어야 합니다.

즉, 다음을 우선해야 합니다.

- 더 나은 agent reply workflow
- 더 나은 review 및 회귀 방지 루프
- 더 명확한 prompt / command contract
- AI가 더 빠르고 안전하게 일할 수 있게 만드는 repo 로컬 도구
- 다른 AI agent가 전체 시스템을 다시 파헤치지 않고도 이어서 일할 수 있게 돕는 문서

## 우선순위 판단 휴리스틱

다음 중 하나 이상에 해당하면 강한 `P0` 후보로 봅니다.

- 실제 안정성 또는 truthfulness 리스크를 제거한다
- 중요한 사용자 경로의 속도를 개선한다
- 새로운 CLI 추가를 눈에 띄게 쉽게 만든다
- 새로운 채널 추가를 눈에 띄게 쉽게 만든다
- 핵심 Slack / Telegram surface의 native chat UX를 개선한다
- 재사용 가능한 end-to-end 검증 레버리지를 늘린다
- repo의 AI workflow를 복리 효과가 나게 개선한다

반대로 다음에 가까우면 우선순위가 낮아집니다.

- 레버리지가 작은 국소적 polish
- 실제 단순화를 만들지 못하는 좁은 rename
- 결합도를 더 깊게 만드는 일회성 workaround
- 현재 기반이 충분히 강하지 않은데 하는 추측성 확장

## Backlog와 함께 쓰는 법

- `docs/tasks/backlog.md`는 여전히 상태와 우선순위의 사실 원본입니다.
- 이 페이지는 그 우선순위를 어떤 기준으로 판단해야 하는지 설명합니다.
- 계획된 task가 여기 적힌 주제와 충돌한다면, 우선순위를 올리기 전에 task 메모부터 다시 써야 합니다.

## 관련 문서

- [프로젝트 개요](README.md)
- [MVP 출시 경로](launch-mvp-path.md)
- [작업 문서](../../../tasks/README.md)
- [백로그](../../../tasks/backlog.md)
- [Stability](../../../features/non-functionals/stability/README.md)
- [DX](../../../features/dx/README.md)
