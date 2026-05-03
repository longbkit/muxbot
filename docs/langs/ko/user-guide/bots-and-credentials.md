[English](../../../user-guide/bots-and-credentials.md) | [한국어](./bots-and-credentials.md)

# 봇과 자격 증명

## 빠른 이해

하나의 bot은 하나의 provider 식별자입니다.

bot 하나가 가지는 것:

- credentials
- fallback `agentId`
- DM 기본값
- shared surface 기본값
- exact DM / shared surface override

route는 그 bot 아래에 속합니다.

## 권장 저장 형태

```json
{
  "bots": {
    "slack": {
      "defaults": {
        "enabled": true,
        "defaultBotId": "default",
        "dmPolicy": "pairing",
        "channelPolicy": "allowlist",
        "groupPolicy": "allowlist",
        "directMessages": {
          "*": {
            "enabled": true,
            "policy": "pairing"
          }
        },
        "groups": {
          "*": {
            "enabled": true,
            "policy": "open"
          }
        }
      },
      "default": {
        "appToken": "${SLACK_APP_TOKEN}",
        "botToken": "${SLACK_BOT_TOKEN}",
        "agentId": "default",
        "dmPolicy": "pairing",
        "channelPolicy": "allowlist",
        "groupPolicy": "allowlist",
        "directMessages": {},
        "groups": {}
      }
    },
    "telegram": {
      "defaults": {
        "enabled": true,
        "defaultBotId": "default",
        "dmPolicy": "pairing",
        "groupPolicy": "allowlist",
        "directMessages": {
          "*": {
            "enabled": true,
            "policy": "pairing"
          }
        },
        "groups": {
          "*": {
            "enabled": true,
            "policy": "open",
            "topics": {}
          }
        }
      },
      "default": {
        "botToken": "${TELEGRAM_BOT_TOKEN}",
        "agentId": "default",
        "dmPolicy": "pairing",
        "groupPolicy": "allowlist",
        "directMessages": {},
        "groups": {}
      }
    }
  }
}
```

## 중요한 규칙

- 저장 config는 `directMessages`와 `groups` 안에서 raw id와 `*`를 씁니다
- CLI는 계속 `dm:<id>`, `group:<id>`를 씁니다
- `dmPolicy`는 wildcard DM 기본값에 대한 빠른 alias입니다
- Slack의 `channelPolicy`, `groupPolicy`는 shared-surface admission을 제어합니다
- Telegram의 `groupPolicy`는 Telegram group admission을 제어합니다
- `groups["*"].policy`는 admit된 group 안에서의 기본 sender policy를 제어합니다
- `disabled`는 owner/admin에게도 침묵함을 뜻합니다

## Invariant

- Slack `channel:<id>`는 호환 입력일 뿐이고, operator 기준의 권장 명명은 여전히 `group:<id>`입니다
- `group:*`는 bot의 기본 multi-user sender policy node입니다
- `directMessages["*"]`와 `groups["*"]`가 canonical wildcard storage node입니다
- exact DM route는 admission config와 behavior override를 함께 가질 수 있습니다
- bot-level default는 "이 bot 아래에서 보통 어떻게 동작하는가"를 말하고, exact route는 "이 surface만 무엇이 다른가"를 말합니다
- exact group / channel / topic route는 `groups["*"].policy`를 상속받아야 할 때 `policy`를 생략하는 편이 맞습니다

## 자주 쓰는 명령

```bash
clisbot bots list
clisbot bots add --channel telegram --bot default --bot-token TELEGRAM_BOT_TOKEN --persist
clisbot bots add --channel slack --bot default --app-token SLACK_APP_TOKEN --bot-token SLACK_BOT_TOKEN --persist
clisbot bots set-agent --channel slack --bot default --agent support
clisbot bots set-default --channel telegram --bot alerts
clisbot bots get-credentials-source --channel slack --bot default
clisbot bots set-dm-policy --channel telegram --bot default --policy pairing
clisbot bots set-group-policy --channel slack --bot default --policy allowlist
clisbot routes set-policy --channel slack group:C1234567890 --bot default --policy allowlist
```

## Credential source

권장 순서:

1. canonical credential files
2. `${SLACK_BOT_TOKEN}` 같은 env placeholder
3. runtime-only mem credentials

Raw token literal을 `clisbot.json`에 장기 보관하는 것은 권장되지 않습니다.

## `start`가 하는 일

첫 실행에서는:

- `clisbot start`가 필요하면 config를 만듭니다
- 명시한 token flag로 해당 bot을 생성하거나 갱신합니다
- enable한 provider만 시작합니다
- shared route는 의도적으로 수동 설정을 유지합니다

첫 실행 이후에는:

- credentials와 fallback agent 변경은 `clisbot bots ...`
- DM, group, topic admission은 `clisbot routes ...`

## 관련 문서

- [라우트와 채팅 표면](./channels.md)
- [CLI 명령](./cli-commands.md)
- [surface policy 구조 표준화와 0.1.43 호환성](../../../tasks/features/configuration/2026-04-24-surface-policy-shape-standardization-and-0.1.43-compatibility.md)
