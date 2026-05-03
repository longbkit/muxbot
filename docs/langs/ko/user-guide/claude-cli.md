[English](../../../user-guide/claude-cli.md) | [한국어](./claude-cli.md)

# Claude CLI 가이드

## 요약

`Claude`는 `clisbot`에서 사용할 수 있지만, 현재는 `codex`보다 운영자 입장에서 더 신경 써야 할 두 가지 동작이 있습니다.

- Claude가 자체 plan approval 단계에서 멈출 수 있음
- bypass-permissions로 실행해도 auto-mode classifier 동작이 계속 개입할 수 있음

## 현재 사실

`clisbot`은 Claude를 `--dangerously-skip-permissions`로 실행합니다.

이 설정은 Claude의 permission prompt를 줄이는 데는 도움이 됩니다.

하지만 현재 이것이 다음을 완전히 막아 주지는 않습니다.

- plan approval gate
- auto-mode classifier 결정

지금 시점에 `clisbot` launch arg나 runner mode 중에서, 이 두 동작을 확실히 해결했다고 검증된 것은 없습니다.

## 문제 1: plan approval gate

관측된 동작:

- Claude가 "plan completed" 류의 확인 화면을 띄울 수 있음
- 이때 운영자는 계속 진행할지, 계획을 수정할지 결정해야 함
- full-permission routed work 중에도 이런 일이 생길 수 있음

왜 불편한가:

- terminal 상태를 못 보면 run이 멈춘 것처럼 보임
- "full permission이면 계속 간다"는 기대를 깨뜨림

현재 workaround:

1. coding 비중이 큰 routed conversation에서는 `/streaming on`을 먼저 켭니다
2. stream에서 Claude가 plan approval 화면 앞에 멈춘 것이 보이면 `/nudge`를 보냅니다
3. 현재 관찰상 `/nudge`는 Enter를 보내고, 대개 기본 선택지를 받아 run을 이어 갑니다
4. 긴 session에서는 `/attach`로 계속 따라가면 됩니다

## 문제 2: auto mode로의 드리프트

관측된 동작:

- bypass-permissions로 띄운 뒤에도 Claude가 작업을 auto-mode classifier로 보내는 경우가 있음
- 이런 현상은 단순한 파일 수정이나 shell command 같은 로컬 작업에도 영향을 줄 수 있음
- 한 번 plan approval 단계를 거친 뒤에는, Claude가 다시 bypass-permissions 기대치로 돌아가기보다 auto-mode처럼 계속 행동할 수 있음

현재 의미:

- `--dangerously-skip-permissions`는 "plan / auto semantics를 절대 쓰지 않는다"와 같은 뜻이 아닙니다
- Claude 동작을 더 예측 가능하게 하고 싶다면, `clisbot`에 연결하기 전에 Claude 자체에서 auto mode를 꺼 두는 편이 낫습니다

어디서 바꾸는가:

- Claude UI `/config`
- Claude 설정 파일 `~/.claude/settings.json`

## 운영자 추천

- coding 경험을 가장 매끄럽게 가져가려면 기본값은 `codex`가 낫습니다
- Claude 자체가 우선이라면 `claude`를 써도 되지만, 긴 coding run에서는 더 가까이 모니터링하는 편이 좋습니다
- planning 동작이 쉽게 나올 작업이라면 초반에 `/streaming on`을 켜 두세요

## 관련 문서

- [Claude CLI 프로필](../../../features/dx/cli-compatibility/profiles/claude.md)
- [CLI 고유 명령](./native-cli-commands.md)
