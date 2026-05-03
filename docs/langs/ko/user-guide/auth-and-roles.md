[English](../../../user-guide/auth-and-roles.md) | [한국어](./auth-and-roles.md)

# 권한과 역할

## 빠른 이해

여기에는 서로 다른 두 질문이 있습니다.

1. 이 사람이 이 surface에서 bot에 닿을 수 있는가?
2. 닿을 수 있다면 어떤 명령을 실행할 수 있는가?

`clisbot`에서는:

- surface admission은 DM / shared route policy가 맡습니다
- command privilege는 app auth와 agent auth가 맡습니다

## Surface admission

### Shared surface

- `disabled`는 완전히 비활성화되고 아무 답도 하지 않음을 뜻합니다
- enabled된 shared surface는 `open` 또는 `allowlist`를 쓸 수 있습니다
- `allowUsers`와 `blockUsers`는 runner에 들어가기 전에 검사됩니다
- allowlist가 sender를 거부하면 bot은 다음과 같이 답합니다

`You are not allowed to use this bot in this group. Ask a bot owner or admin to add you to \`allowUsers\` for this surface.`

### owner / admin 동작

- app `owner`와 app `admin`은 allowlist가 일반 사용자를 막는 경우에도 enabled된 shared surface를 사용할 수 있습니다
- `blockUsers`는 여전히 우선합니다
- `disabled`도 여전히 우선합니다

### DM surface

- DM wildcard 기본값은 `directMessages["*"]`에 있습니다
- pairing approval은 요청을 받은 bot의 wildcard DM route에 기록됩니다
- exact DM route는 필요할 때 사용자별 admission / behavior override를 가질 수 있습니다

## Invariant

- surface policy는 "이 principal이 이 surface에 들어올 수 있는가?"를 답합니다
- auth role은 "들어온 뒤 무엇을 할 수 있는가?"를 답합니다
- owner/admin은 `groupPolicy` / `channelPolicy` admission을 우회하지 못하고, group이 admit되어 enabled된 뒤에만 sender allowlist를 우회합니다
- owner/admin도 `disabled`는 우회하지 못합니다
- owner/admin도 `blockUsers`는 우회하지 못합니다
- deny text는 다인 surface를 위한 공통 인간 지향 용어로 `group`을 의도적으로 씁니다

## 역할

현재 app role:

- `owner`
- `admin`
- `member`

현재 agent role:

- `admin`
- `member`

중요한 현재 동작:

- app `owner`와 app `admin`은 DM pairing을 자동으로 우회합니다
- app `owner`와 app `admin`은 agent-admin check도 암묵적으로 통과합니다
- `principal`은 `<platform>:<provider-user-id>` 형식의 auth identity입니다
- principal은 항상 플랫폼 범위를 유지합니다. 예: `telegram:1276408333`, `slack:U123ABC456`
- 사용자에게 role / permission을 줄 때는 `--user <principal>`을 씁니다
- 현재 sender의 effective permission을 확인할 때는 `--sender <principal>`을 씁니다

## 자주 쓰는 명령

```bash
clisbot auth show app
clisbot auth show agent-defaults
clisbot auth get-permissions --sender telegram:1276408333 --agent default --json
clisbot auth add-user app --role owner --user telegram:1276408333
clisbot auth add-user app --role admin --user slack:U123ABC456
clisbot auth add-user agent --agent support --role admin --user slack:UOPS1
clisbot auth add-permission agent-defaults --role member --permission transcriptView
clisbot auth remove-permission agent-defaults --role member --permission shellExecute
```

## 첫 owner claim

Runtime rule:

- runtime 시작 시 owner가 하나도 없으면 `ownerClaimWindowMinutes` 동안 owner claim이 열립니다
- 그 창 안에서 처음 성공한 DM이 app `owner`가 됩니다
- owner가 생기면 claim은 즉시 닫힙니다

## 실전 기본값

- 위험한 명령의 통제는 surface allowlist가 아니라 auth에 두는 편이 안전합니다
- "여기서 누가 말을 걸 수 있나?"는 surface policy로 답합니다
- "들어온 뒤 무엇을 할 수 있나?"는 auth role로 답합니다
- 민감한 작업 전에는 `clisbot auth get-permissions --sender <principal> --agent <id> --json`으로 읽기 전용 권한 검사를 하세요
- 누구에게도 응답하지 않아야 하는 surface라면 `disabled`를 쓰는 것이 가장 확실합니다

## 관련 문서

- [권한 부여](../../../features/auth/README.md)
- [라우트와 채팅 표면](./channels.md)
- [surface policy 구조 표준화와 0.1.43 호환성](../../../tasks/features/configuration/2026-04-24-surface-policy-shape-standardization-and-0.1.43-compatibility.md)
