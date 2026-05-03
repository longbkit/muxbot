[English](../../../../features/channels/README.md) | [한국어](./README.md)

# Channels

## 요약

Channels는 `clisbot`에서 사용자와 직접 맞닿는 대화 채널 계층입니다.

현재 이 계층이 소유하는 외부 대화 공간은 다음과 같습니다.

- 현재 Slack
- 현재 Telegram
- 또 하나의 channel로 붙일 수 있는 API-compatible access
- 앞으로 계획된 세 갈래 Zalo 확장:
  - `zalo-bot`
  - `zalo-oa`
  - `zalo-personal`
- 앞으로 붙일 Discord와 그 밖의 비슷한 integration

## 상태

활성

## 왜 존재하는가

이 프로젝트의 목표는 subscription 기반 coding agent를 단순한 직접 API 사용이 아니라, 실제로 쓰기 좋은 접근 지점으로 노출하는 것입니다.

그 접근 지점이 구체화되는 곳이 Channels입니다.

## 범위

- inbound message와 request 처리
- 지원 채널에서 들어오는 inbound file / attachment 수집
- Slack `dm`, `group`, `channel` 같은 conversation kind 판별
- Telegram forum topic처럼 first-class sub-surface를 지원하는 채널에서 topic-aware conversation kind 판별
- `open`, `pairing`, `allowlist`, `disabled` 같은 direct-message access control
- 제한된 direct-message onboarding을 위한 pairing-code reply flow
- channel 경계에서 처리하는 slash-prefixed conversation command
- outbound reply와 streaming update
- inbound ack reaction, Slack assistant thread status, live in-thread processing reply 같은 초기 사용자 가시 피드백
- thread와 reply 동작
- message edit 지원 여부, append-only fallback 같은 channel transport 동작
- edited live reply를 지원하는 채널에서 long-message chunk를 다시 맞추는 처리
- 채널별 기본 chat-first rendering
- 필요할 때 위아래 chrome을 걷어낸 normalized runner output 기반의 transcript 정리
- 사용자가 요청했을 때 whole-session visibility를 위한 명시적 transcript request command 패턴
- 진행 중인 long-running session에 붙는 attach, detach, interval watch 같은 observer-style run control command
- 같은 channel account 안에서 긴 대화 하나가 다른 대화를 막지 않도록 하는 channel-ingestion concurrency
- 나중의 mention이 최근 몇 개의 무시된 routed message를 회복할 수 있도록 하는, 범위를 제한한 recent-message replay

## 비목표

- backend 전용 runner 동작
- 정식 agent session 소유권 규칙
- 운영자 전용 control action

## 관련 작업 폴더

- [docs/tasks/features/channels](../../../../tasks/features/channels)

## 관련 테스트 문서

- [docs/tests/features/channels](../../../../tests/features/channels/README.md)

## 관련 리서치

- [Slack Thread Follow-Up Behavior](../../../../research/channels/2026-04-05-slack-thread-follow-up-behavior.md)
- [OpenClaw Telegram Topics And Slack-Parity Plan](../../../../research/channels/2026-04-05-openclaw-telegram-topics-and-parity-plan.md)
- [OpenClaw Pairing Implementation](../../../../research/channels/2026-04-06-openclaw-pairing-implementation.md)
- [OpenClaw CLI Command Surfaces And Slack Telegram Send Syntax](../../../../research/channels/2026-04-09-openclaw-cli-command-surfaces-and-slack-telegram-send-syntax.md)
- [OpenClaw Channel Standardization Vs Clisbot Gaps](../../../../research/channels/2026-04-10-openclaw-channel-standardization-vs-clisbot-gaps.md)
- [OpenClaw Structured Channel Rendering Techniques For Slack And Telegram](../../../../research/channels/2026-04-14-openclaw-structured-channel-rendering-techniques.md)
- [OpenClaw Zalo Paths And Official Zalo Bot Platform](../../../../research/channels/2026-04-18-openclaw-zalo-paths-and-official-zalo-bot-platform.md)

## 관련 기능 문서

- [Message Actions And Bot Routing](../../../../features/channels/message-actions-and-channel-accounts.md)
- [Message Command Formatting And Render Modes](../../../../features/channels/message-command-formatting-and-render-modes.md)
- [Agent Progress Reply Wrapper And Prompt](../../../../features/channels/agent-progress-reply-wrapper-and-prompt.md)
- [Streaming Mode And Message-Tool Draft Preview Handoff](../../../../features/channels/streaming-mode-and-message-tool-draft-preview-handoff.md)
- [Prompt Templates](../../../../features/channels/prompt-templates.md)
- [Transcript Visibility And Verbose Levels](../../../../features/channels/transcript-visibility-and-verbose-levels.md)
- [Structured Channel Rendering And Native Surface Capabilities](../../../../features/channels/structured-channel-rendering-and-native-surface-capabilities.md)
- [Loop Slash Command](../../../../features/channels/loop-slash-command.md)
- [Recent Conversation Replay](../../../../features/channels/recent-conversation-replay.md)
- [Zalo Bot, Zalo OA, And Zalo Personal Channel Strategy](../../../../tasks/features/channels/2026-04-18-zalo-bot-oa-and-personal-channel-strategy.md)
- [Official Zalo Bot Platform Channel MVP](../../../../tasks/features/channels/2026-04-18-zalo-bot-platform-channel-mvp.md)

## 의존성

- [Agents](../../../../features/agents/README.md)
- [Runners](../../../../features/runners/README.md)
- [Configuration](../../../../features/configuration/README.md)
- [Transcript Presentation And Streaming](../../../../architecture/transcript-presentation-and-streaming.md)

## 현재 초점

`SLACK_TEST_CHANNEL`에서 Slack MVP를 사실에 맞게 유지하는 것이 핵심입니다.

지금 반드시 지켜야 할 대화 공간 계약은 다음과 같습니다.

- 1인 대화 공간은 `directMessages` 아래에 둡니다.
- 다인 대화 공간은 `groups` 아래에 둡니다.
- 운영자용 id는 `dm:<id|*>`, `group:<id>`, `group:*`, `topic:<chatId>:<topicId>` 형태를 그대로 유지합니다.
- Slack `channel:<id>`는 계속 compatibility input일 뿐입니다.
- provider transport가 Slack channel이든 Telegram topic이든, 다인 대화 공간을 가리키는 사람 기준 용어는 계속 `group`입니다.

- thread-backed Slack conversation은 session key 단위로 격리됩니다.
- 종료된 tmux session을 stored runner session-id로 복구하는 흐름은 이미 검증되어 있습니다.
- 명시적 mention 없이 이어지는 thread follow-up은, 해당 routed conversation kind에 대한 Slack app `message.*` event subscription에 의존합니다.
- 2026-04-05의 live Slack 검증으로, 사람이 시작한 thread에서 `parent_user_id`는 bot이 아니라 thread root 작성자를 가리킨다는 점이 확인됐습니다. 따라서 root author만 기준으로 gate를 거는 방식은 일반적인 Slack thread continuation을 사실대로 설명하지 못합니다.
- 최신 OpenClaw `main`은 Slack follow-up을 "이 thread에 bot이 이미 한 번 답했다"는 sent-thread participation cache로 모델링합니다.
- 현재 `clisbot`은 session-scoped follow-up state로 같은 사용자 체감 규칙에 도달합니다.
- 2026-04-05 live 검증으로 Slack `message.channels`를 켜면, bot이 한 번 답한 뒤 channel thread에서 자연스러운 no-mention continuation이 열리는 것이 확인됐습니다.
- direct-message access control은 이제 session routing 전에 OpenClaw와 비슷한 gate를 따릅니다.
  - `open`은 sender를 즉시 허용합니다.
  - `pairing`은 아직 모르는 sender에게 pairing code를 발급합니다.
  - `allowlist`는 설정되었거나 이전에 승인된 sender만 허용합니다.
  - `disabled`는 그 DM 대화 공간을 무시합니다.
- Slack과 Telegram direct message는 OpenClaw와 맞추기 위해 기본적으로 `policy: "pairing"`을 사용합니다.
- 공유 대화 공간은 OpenClaw 스타일의 안전한 기본값인 `allowlist`와 `requireMention: true`를 유지합니다.
- route되지 않은 공유 대화 공간의 onboarding 안내는 이제 하나의 공통 policy layer를 따릅니다. Slack에서는 명시적 mention이 route 안내를 보여 주고, Telegram group / topic에서도 같은 역할을 하면서 Telegram 고유의 slash onboarding은 유지합니다.
- OpenClaw의 드문 공유 대화 공간 이력은 참고 리서치로만 남겨 두고, 현재 `clisbot`은 admission `allowlist`와 sender 기본값 `open`을 조합해 사용합니다.
- Slack은 허용된 inbound message를 configurable reaction, Slack assistant thread status, live in-thread processing reply로 즉시 인정해야 합니다.
- 기본 Slack feedback은 `ackReaction: ""`, `typingReaction: ""`, `processingStatus.enabled: true`를 유지해야 합니다.
- 진행 중인 long-running session은 `/attach`, `/detach`, `/watch every <duration>`을 지원해야 사용자가 raw transcript로 바로 떨어지지 않고도 이 thread에서 실행 상황을 따라갈 수 있습니다.
- routed conversation은 이제 `/loop`도 지원합니다. prompt가 없을 때는 `LOOP.md`를 유지보수 fallback으로 쓰고, `/loop status` 또는 `/loop cancel`로 활성 loop를 제어할 수 있으며, 반복 횟수 기반 loop, 관리형 interval loop, `every day at 07:00` 같은 wall-clock loop를 모두 다룹니다.
- 현재 observer 범위는 routed conversation의 thread 단위입니다. 같은 thread에서 `/attach`나 `/watch`를 다시 실행하면 이전 observer mode를 덮어씁니다.
- 현재 `/detach`는 완전한 silent unsubscribe가 아니라 sparse-follow입니다. live update는 멈추지만 드문 진행 신호는 계속 올 수 있고, run이 끝나면 최종 정산 답변은 여전히 같은 thread로 돌아옵니다.
- channel observer delivery는 명시적으로 best-effort입니다. Slack이나 Telegram 전송/수정이 일시적으로 실패해 중간 update가 빠질 수는 있어도, runner supervision이 끊기거나 process restart가 필요해져서는 안 됩니다.
- routed thread의 `/status`는 현재 session run 상태를 보여 줘야 하며, transcript-first inspect로 내려가지 않고도 분리된 작업이 아직 살아 있는지 볼 수 있어야 합니다.
- Slack과 Telegram은 이제 conversation boundary마다 최근 routed inbound message 5개와 `lastProcessedMarker`만 유지하고, 나중 호출이 최근 문맥을 다시 가져와야 할 때는 아직 처리하지 않은 tail만 replay합니다.
- 다음 API 대화 공간에도 같은 channel model을 확장해야 합니다.
- Telegram은 이제 topic-aware channel 대화 공간으로 제공되며, topic identity를 Slack follow-up 방식으로 흉내 내지 않고 OpenClaw 스타일의 group / topic config inheritance를 사용합니다.
- Telegram transport는 Telegram Bot API의 retry-after hint를 존중하고, streaming이 429 rate limit로 쉽게 깨지지 않도록 live message edit 속도를 조절해야 합니다.
- Telegram processing feedback은 작업이 끝날 때까지 active topic 범위에 맞는 typing heartbeat를 유지해야 하며, 이는 typing이 active topic에 묶인다는 OpenClaw 문서화 규칙을 따릅니다.
- Telegram polling은 더 이상 전역 순서대로 막히면 안 됩니다. 한 바쁜 topic이나 DM이 같은 bot account의 다른 topic / chat update dispatch를 지연시켜서는 안 됩니다.
- Slack과 Telegram은 이제 runtime bootstrap, 운영자 `message` command, runtime health summary, 공통 route-policy composition을 위한 first-class `ChannelPlugin` seam을 공유합니다.
- 다만 provider event loop, payload parsing, transport semantics는 여전히 provider가 소유해야 하며, 그래야 미래 channel도 provider 특성을 납작하게 만들지 않고 같은 control seam에 꽂을 수 있습니다.
- 다음 베트남 채널 확장은 이제 세 개의 별도 provider family로 분명히 잡혀 있습니다.
  - `zalo-bot` 먼저
  - `zalo-oa` 다음
  - `zalo-personal`은 선택적으로 마지막
- `zalo-bot`은 맞는 부분에서 Telegram 유사 아키텍처 패턴을 재사용하되, Zalo 고유의 transport, policy, limit 의미는 사실대로 유지해야 합니다.
