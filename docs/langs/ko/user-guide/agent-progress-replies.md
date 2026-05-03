[English](../../../user-guide/agent-progress-replies.md) | [한국어](./agent-progress-replies.md)

# Agent progress reply

## 목적

이 페이지는 Codex나 Claude가 작업 중일 때 Slack / Telegram으로 짧은 progress update를 다시 보내는 chatbot flow를 테스트하고 싶을 때 사용합니다.

## `clisbot`이 하는 일

현재 local developer flow는 세 부분으로 구성됩니다.

1. `clisbot`이 `~/.clisbot/bin/clisbot`에 안정적인 local wrapper 생성
2. runner가 띄운 agent session은 startup 시 이 wrapper path를 export받음
3. Slack / Telegram은 현재 대화에 맞는 exact reply command를 담은 짧은 hidden system block을 agent-bound prompt 앞에 붙임

따라서 agent가 다른 workspace 안에서 돌고 있어도, 현재 작업 디렉터리에 의존하지 않는 machine-local command로 progress update를 보낼 수 있습니다.

## 가장 빠른 테스트 흐름

먼저 `clisbot`을 평소처럼 시작합니다.

```bash
bun run start --cli codex --bot-type team
```

그다음:

1. 설정된 Slack / Telegram test surface에 실제 사람이 메시지 전송
2. `clisbot`이 그 메시지를 configured agent로 route
3. agent prompt에는 현재 대화용 exact local reply command가 포함됨
4. agent는 `clisbot message send ...`로 progress와 final reply를 보낼 수 있음

멀티라인 / quote가 많은 내용에 권장되는 패턴:

```bash
~/.clisbot/bin/clisbot message send \
  --channel slack \
  --target channel:C1234567890 \
  --thread-id 1712345678.123456 \
  --input md \
  --render native \
  --message "$(cat <<\__CLISBOT_MESSAGE__
working on it

step 1 complete
__CLISBOT_MESSAGE__
)"
```

이 형식을 권장하는 이유:

- delimiter를 `<<\__CLISBOT_MESSAGE__`처럼 quote 없이 두면, 나중에 JSON이나 shell string 안에 또 감싸져도 깨질 가능성이 줄어듭니다
- heredoc 종료 시 `__CLISBOT_MESSAGE__`를 단독 줄에 둡니다
- 이 패턴은 multiline text, mixed quotes, shell-like text, code fence까지 regression test가 있습니다
- `--input md --render native`는 shipped default지만, reply contract를 명시적으로 보여 주려고 예시에는 유지합니다

## 중요한 규칙

- 반드시 실제 사람이 보낸 메시지로 flow를 시작해야 함
- inbound user turn을 `clisbot message send ...`로 흉내 내면 안 됨
- wrapper path는 로컬 머신에서 안정적으로 `~/.clisbot/bin/clisbot`
- shell 예시를 복사할 때는 일반 ASCII 공백 사용
- agent에게 주입되는 prompt는 progress update를 짧게 유지하라고 요구
- 현재 prompt policy 기본값:
  - progress message 최대 `3`
  - final response는 정확히 `1`

## 왜 wrapper가 필요한가

agent session은 `clisbot` repo root에서 돌지 않습니다.

그래서:

```bash
bun run src/main.ts message send ...
```

같은 repo-local command는 agent에게 주는 runtime instruction으로 적합하지 않습니다.

local wrapper는 항상 활성 checkout으로 돌아가게 만들어 이 문제를 해결합니다.

## 설정

Slack / Telegram은 이제 작은 prompt policy block을 가집니다.

```json
"agentPrompt": {
  "enabled": true,
  "maxProgressMessages": 3,
  "requireFinalResponse": true
}
```

`agentPrompt.enabled`를 끄면 해당 provider의 agent-bound prompt에 reply instruction block을 주입하지 않습니다.

user-visible reply delivery는 `streaming`, `response` 옆에서 설정됩니다.

```json
"streaming": "off",
"response": "final",
"responseMode": "message-tool",
"additionalMessageMode": "steer",
"surfaceNotifications": {
  "queueStart": "brief",
  "loopStart": "brief"
}
```

- `capture-pane`: 기존 방식. 정규화된 runner output을 읽어 progress / final을 surface가 게시
- `message-tool`: pane은 계속 관찰하지만 canonical progress / final reply는 `clisbot message send ...`를 통해 오기를 기대
- `streaming`: 두 response mode 모두에 적용
- `steer`: session이 active일 때 뒤늦은 human message를 현재 run에 바로 주입
- `queue`: session이 active일 때 뒤늦은 human message를 순서대로 대기시킴

`message-tool`은 중복 reply나 raw pane 기반 final settlement를 피하면서도, status / attach / watch / 내부 runtime logic을 위한 tmux 관찰은 유지하고 싶을 때 유용합니다.

## Response mode precedence

resolved `responseMode` 순서:

1. surface override
2. agent override
3. provider default
4. built-in default `message-tool`

즉, pane capture는 항상 유지하되 user-visible delivery를 pane settlement로 할지 `clisbot message send ...`로 할지를 위 순서로 정합니다.

## 운영자 명령

agent / route response mode와 additional-message-mode는 다음 명령들로 확인 / 변경할 수 있습니다.

```bash
clisbot agents response-mode status --agent default
clisbot agents response-mode set message-tool --agent default
clisbot agents additional-message-mode status --agent default
clisbot agents additional-message-mode set steer --agent default
clisbot routes get-response-mode --channel telegram group:-1001234567890 --bot default
clisbot routes set-response-mode --channel telegram group:-1001234567890 --bot default --mode capture-pane
clisbot routes get-additional-message-mode --channel slack group:C1234567890 --bot default
clisbot routes set-additional-message-mode --channel slack group:C1234567890 --bot default --mode queue
```
