[English](../../../user-guide/native-cli-commands.md) | [한국어](./native-cli-commands.md)

# CLI 고유 명령

## 목적

이 페이지는 `clisbot`이 아래쪽 coding CLI의 native command / skill system과 어떻게 공존하는지 설명할 때 사용합니다.

현재 특히 중요한 대상:

- Codex
- Claude Code
- Gemini CLI

CLI별 참고:

- [Codex CLI 가이드](./codex-cli.md)
- [Claude CLI 가이드](./claude-cli.md)
- [Gemini CLI 가이드](./gemini-cli.md)

## 핵심 규칙

`clisbot`은 다음과 같은 소수의 chat-surface control command를 자신이 직접 예약합니다.

- `/start`
- `/help`
- `/status`
- `/whoami`
- `/transcript`
- `/stop`
- `/new`
- `/nudge`
- `/followup ...`
- `/streaming ...`
- `/responsemode ...`
- `/additionalmessagemode ...`
- `/queue ...`
- `/steer ...`
- `/loop ...`
- `/bash ...`

`/`로 시작하더라도 위 reserved command가 아니면, `clisbot`은 그 입력을 underlying agent CLI로 그대로 전달합니다.

즉, `clisbot`은 native command surface를 지우거나 재해석하려 하지 않고 그대로 보존합니다.

## 실제로는 어떻게 보이나

### Claude Code

Claude Code 사용자는 종종 `/...` 형식의 native command / skill을 직접 씁니다.

예시:

- `/review`
- `/memory`
- `/agents`
- `/code-review`

`clisbot` chat surface에서는:

- `clisbot` reserved command라면 `clisbot`이 처리합니다
- 아니면 raw command를 Claude에 그대로 넘깁니다

즉, 기존 Claude setup이 `/code-review` 같은 native command를 알고 있다면 Slack이나 Telegram에서도 그대로 쓸 수 있습니다.

권장 호출 방식:

- Telegram처럼 메시지를 그대로 통과시키는 surface에서는:
  - `/code-review`
- Slack처럼 `/...`가 Slack 자체 slash handling에 먼저 잡힐 수 있는 surface에서는:
  - 앞에 공백을 둔 ` /code-review`
- Claude에서 원래 자연어로 부르던 습관이 있다면:
  - `Invoke /code-review`

예시:

```text
/code-review
```

Loop 예시:

```text
/loop 3 /code-review
```

의미:

- `/loop`는 `clisbot`이 처리합니다
- loop body는 `/code-review` 그대로 남습니다
- 각 iteration이 `/code-review`를 Claude의 native input으로 전달합니다

중요한 경고:

- native Claude command에 `\code-review`나 `::code-review`를 쓰면 안 됩니다
- `\`와 `::`는 `clisbot` shortcut prefix이지, `clisbot` 문법을 Claude slash 문법으로 바꿔 주는 번역 계층이 아닙니다
- `\code-review` 같은 입력은 그대로 전달되므로 Claude는 `\code-review`를 받지 `/code-review`를 받지 않습니다

### Codex

Codex 사용자는 종종 다음에 의존합니다.

- `/model`, `/review` 같은 native slash command
- 일반 prompt 안에서 skill 이름을 직접 호출
- Codex setup이 빠른 skill summon으로 해석하는 `$gog` 같은 짧은 패턴

`clisbot` chat surface에서는:

- `clisbot` reserved command는 계속 `clisbot`이 처리합니다
- reserved가 아닌 native slash command는 그대로 전달합니다
- command가 아닌 일반 텍스트도 그대로 전달합니다

그래서 기존 Codex workflow가 다음을 이미 쓰고 있다면:

- `/review`
- `$gog`
- `$code-review`
- `use gog to check my calendar`

`clisbot`은 입력을 지우거나 rewrite하지 않고 그대로 Codex에 보냅니다.

Codex에서 권장되는 호출 방식:

- 이미 `$code-review`나 `$gog` 같은 `$...` summon을 쓰고 있다면, chat surface에서는 이쪽이 가장 깔끔한 경우가 많습니다
- Slack slash-command 충돌도 피할 수 있습니다
- `/review` 같은 Codex native slash command를 쓴다면 Slack에서는 앞 공백 규칙이 그대로 적용됩니다

중요한 구분:

- `clisbot`은 Codex skill resolution을 직접 구현하지 않습니다
- 단지 Codex가 원래 하던 방식대로 native skill이나 prompt를 해석할 수 있게 입력을 보존할 뿐입니다

### Gemini CLI

아키텍처적으로는 Gemini에도 같은 pass-through 규칙이 적용됩니다.

- `clisbot` reserved command는 `clisbot`이 처리합니다
- 그 외 `/...` command는 그대로 전달합니다

다만:

- Gemini native command 동작은 routed Slack / Telegram 환경에서 Codex나 Claude만큼 깊게 검증되지는 않았습니다

따라서 현재 운영자 가이드는 다음과 같습니다.

- Gemini native command pass-through를 의도된 모델로 이해하되
- 정확한 Gemini command / extension flow는 실제 route에서 직접 검증한 뒤 본격적으로 의존하세요

## `clisbot` command를 강제로 부르고 싶을 때

헷갈림을 피하고 `clisbot` 제어 명령을 명시적으로 부르고 싶다면 다음 prefix를 씁니다.

- `::status`
- `\\status`
- `::transcript`
- `\\transcript`

이 prefix는 `clisbot` 소유이지 underlying coding CLI 소유가 아닙니다.

특히 다음 상황에서는 가장 안전한 우회 경로입니다.

- native CLI command 이름이 `clisbot` command와 겹칠 때
- Slack의 native slash handling이 방해할 때
- heavily customized native CLI 환경에서도 "이건 `clisbot` command다"를 확실히 하고 싶을 때

단, Claude / Gemini native slash command에 대해 해당 CLI가 정확히 그 문법을 기대하지 않는 한 이런 prefix를 쓰지 마세요.

## Slack에서의 주의점

Slack은 `/...` 입력을 `clisbot`보다 먼저 가로챌 수 있습니다.

그럴 때는 앞에 공백을 넣어 보냅니다.

```text
 /review
```

또는 `clisbot` shortcut prefix를 사용합니다.

```text
::status
```

## 한계

현재 동작은 의도적으로 단순합니다.

- `clisbot`은 native CLI command를 autocomplete하지 않습니다
- native CLI skill folder를 스캔해서 합쳐진 command menu를 렌더하지 않습니다
- 한 vendor의 native syntax를 다른 vendor syntax로 rewrite하지 않습니다

reserved command가 아닌 native command text를 그냥 그대로 보존할 뿐입니다.

## 기억법

간단히 이렇게 생각하면 됩니다.

- chat surface나 runtime을 제어하고 싶다면 `clisbot` command를 사용합니다
- Codex, Claude, Gemini에게 자기 native command / skill system으로 일을 시키고 싶다면 `clisbot`은 대개 그 입력을 그대로 전달합니다

그래서 기존 Codex나 Claude 습관을 `clisbot` 뒤의 chat surface에서도 자연스럽게 이어 갈 수 있습니다.
