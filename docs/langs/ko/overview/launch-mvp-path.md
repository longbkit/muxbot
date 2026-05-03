[English](../../../overview/launch-mvp-path.md) | [Tiếng Việt](../../vi/overview/launch-mvp-path.md) | [简体中文](../../zh-CN/overview/launch-mvp-path.md) | [한국어](./launch-mvp-path.md)

# MVP 출시 경로

## 목적

이 문서는 현재의 출시 순서를 분명하게 정리합니다.

다음 관점에서 짧은 roadmap 렌즈로 사용하면 됩니다.

- 커뮤니티 독자
- 제품 우선순위 판단
- backlog 검토

세부 실행 내용은 연결된 task 문서에 남겨두는 것이 맞습니다.

## 출시 원칙

- 제품은 여러 계층과 여러 surface에 걸쳐 설정할 수 있어도, 기본값은 언제나 명확해야 합니다
- status와 debug surface는 operator가 지금 어느 계층이 살아 있는지 파악할 수 있을 만큼 사실에 가까워야 합니다
- 첫 실행의 마찰은 최대한 낮아야 합니다
- 안정성과 runtime truthfulness는 나중에 다듬는 요소가 아니라 launch gate입니다
- naming, config shape, 사용자에게 보이는 surface의 명확함도 제품 품질의 일부입니다

## 현재 스냅샷

1. 먼저 기반 다지기:
   - 마찰 없는 시작과 안정적인 credential 저장
   - 안정적인 runtime과 사실에 맞는 status / debug surface
   - 현재 차별화되는 workflow 기능으로서의 `/loop`
2. 국제 출시 게이트:
   - Claude, Codex, Gemini CLI가 모두 안정적으로 지원되고 충분히 검증되어야 함
   - 현재 공유 채널 패키지는 Slack + Telegram에 집중
3. 베트남 출시 패키지:
   - 같은 CLI 3종은 유지
   - Zalo Bot Platform 추가
   - Zalo Official Account 추가
   - Zalo Personal 추가
4. 다음 확장 파동:
   - Discord, WhatsApp, Google Workspace, Microsoft Teams 같은 채널 추가
   - 실제 사용자 수요를 바탕으로 Cursor, Amp, OpenCode, Qwen, Kilo, Minimax 같은 agentic CLI 추가
5. 아직 열려 있는 결정:
   - 더 넓은 공개 출시 전에 각 CLI의 native slash command 호환, override, 사용자화까지 함께 마무리해야 하는지 결정

## 0단계: 기반

이것들은 선택적인 다듬기 항목이 아닙니다.

즉, launch gate입니다.

- 먼저 환경을 꾸미지 않아도 빠르게 시작할 수 있어야 함
- 첫 성공 이후 credential이 안정적으로 남아야 함
- runner와 channel 동작이 안정적이고 사실에 맞아야 함
- operator가 credential 출처, route 상태, runtime health를 볼 수 있어야 함
- 반복 작업과 일정성 작업을 위한 현재 핵심 기능으로 `/loop`를 유지

## 1단계: 국제 핵심 출시

첫 대외 출시에서는 공통 CLI 3종을 제대로 입증해야 합니다.

- Claude
- Codex
- Gemini

이 단계의 완료 기준:

- 각 CLI가 기존 Slack / Telegram 패키지에서 제대로 동작
- 각 CLI마다 setup, runtime, interrupt 검증이 충분해 신뢰 가능
- 문서와 status surface가 CLI별 주의사항을 분명하게 보여 줌

이후 CLI 지원을 넓히더라도 이 첫 번째 검증 게이트를 흐려서는 안 됩니다.

## 2단계: 베트남 출시 패키지

베트남 시장에서는 같은 핵심 CLI 조합 위에 다음을 더해야 합니다.

- Zalo Bot Platform
- Zalo Official Account
- Zalo Personal

이건 채널 패키지의 이정표이지, 다른 제품 방향을 뜻하지는 않습니다.

## 3단계: 핵심 이후 확장

핵심 3종이 입증된 뒤에는:

- 실제 사용자 수요에 따라 CLI 지원을 확장
- 수요 스냅샷이 잡힌 뒤에만 Cursor, Amp, OpenCode, Qwen, Kilo, Minimax를 우선 검토
- 지원 가능한 모든 CLI를 동일 우선순위 출시 항목으로 취급하지 않기

Slack, Telegram, 그리고 베트남용 Zalo 채널 패키지가 안정된 뒤에는:

- Discord로 확장
- WhatsApp으로 확장
- Google Workspace로 확장
- Microsoft Teams로 확장

## Native Slash Commands

이 부분은 출시 형태를 좌우하는 명시적 결정 사항으로 남아 있습니다.

시스템은 이미 `clisbot` 자체 slash command와 native pass-through fallback을 지원합니다.

아직 남아 있는 질문은, 더 넓게 공개하기 전에 아래도 함께 포함해야 하느냐입니다.

- CLI별 native slash command 호환 메모
- 예약 명령 충돌 처리
- override 또는 이름 변경 surface
- 충돌하는 명령 prefix에 대한 operator / 사용자 맞춤 설정

## Backlog 링크

- [Common CLI Launch Coverage And Validation](../../../tasks/features/runners/2026-04-13-common-cli-launch-coverage-and-validation.md)
- [Zalo Bot, Zalo OA, And Zalo Personal Channel Strategy](../../../tasks/features/channels/2026-04-18-zalo-bot-oa-and-personal-channel-strategy.md)
- [Vietnam Channel Launch Package](../../../tasks/features/channels/2026-04-13-vietnam-channel-launch-package.md)
- [Secondary CLI Expansion Prioritization](../../../tasks/features/runners/2026-04-13-secondary-cli-expansion-prioritization.md)
- [Post-MVP Channel Expansion Wave](../../../tasks/features/channels/2026-04-13-post-mvp-channel-expansion-wave.md)
- [Native Slash Command Compatibility And Overrides](../../../tasks/features/agents/2026-04-13-native-slash-command-compatibility-and-overrides.md)
