[English](../../../user-guide/gemini-cli.md) | [한국어](./gemini-cli.md)

# Gemini CLI 가이드

## 요약

`Gemini`는 `clisbot`에서 사용할 수 있지만, `codex`보다 환경에 더 민감합니다.

핵심 문제는 session continuity가 아닙니다.

핵심 문제는 Gemini의 auth나 setup이 미리 깔끔하게 준비되지 않았을 때 startup과 routed delivery 품질이 흔들릴 수 있다는 점입니다.

## 현재 강점

- ready pattern이 비교적 명시적임
- startup blocker가 비교적 분명하게 드러남
- `sessionId` capture와 resume 모델이 탄탄함

## 현재 주의점

- Gemini는 runtime이 재사용할 수 있는 방식으로 미리 인증되어 있어야 함
- 일부 `message-tool` 흐름에서 routed reply 품질이 아직 기대만큼 강하지 않음
- upstream auth / setup 화면이 바뀔 수 있음

## 운영자 추천

- Gemini가 이미 인증돼 있고 정말 Gemini를 쓰고 싶다면 충분히 쓸 만한 routed CLI입니다
- 일반적인 기본값으로는 여전히 `codex`를 우선하는 편이 안전합니다
- 구현 세부를 더 보고 싶다면 [Gemini CLI 프로필](../../../features/dx/cli-compatibility/profiles/gemini.md)을 확인하세요
