[English](../../../user-guide/codex-cli.md) | [한국어](./codex-cli.md)

# Codex CLI 가이드

## 요약

`Codex`는 현재 `clisbot`에서 routed coding work용 기본 추천값입니다.

지금 지원하는 세 가지 주요 CLI 가운데, 운영 안정성이 가장 좋습니다.

## 기본 추천인 이유

- session continuity가 강함
- routed coding 동작이 안정적임
- 현재 기준으로 Claude보다 operator 입장에서 덜 놀라움
- Gemini보다 auth gating 문제를 덜 겪음

## 현재 주의점

- startup readiness는 아직 명시적 신호보다 heuristic에 더 의존함
- interrupt 확인은 아직 best-effort 수준임
- `/status` 출력 차이로 일부 compatibility heuristic이 흔들릴 수 있음

## 운영자 추천

- Slack이나 Telegram에서 coding 중심 bot을 가장 안전하게 시작하고 싶다면 `codex`부터 쓰는 것이 좋습니다
- 호환성 경계를 더 자세히 보고 싶다면 [Codex CLI 프로필](../../../features/dx/cli-compatibility/profiles/codex.md)을 보세요
