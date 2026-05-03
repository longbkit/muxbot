[English](../../../features/README.md) | [Tiếng Việt](../../vi/features/README.md) | [简体中文](../../zh-CN/features/README.md) | [한국어](./README.md)

# 기능 문서

## 목적

`docs/features/`는 다음 질문에 답하기 위한 문서 계층입니다.

- 현재 어떤 기능 영역이 있는가
- 각 영역의 상태는 어떤가
- 해당 영역의 메인 문서는 어디인가
- 구현 작업은 어떤 task 문서에 연결되어 있는가

현재 한국어는 진입 페이지와 Channels 하위 진입 문서까지 번역되어 있습니다. 다른 기능 영역의 하위 문서는 대응 mirror가 생길 때까지 영어 원문으로 연결됩니다.

## 가장 중요한 진입점

- [feature-tables.md](../../../features/feature-tables.md): 기능 상태의 표준 인덱스

## 주요 기능 영역

- [Agents](../../../features/agents/README.md)
- [Auth](../../../features/auth/README.md)
- [Channels](./channels/README.md)
- [Configuration](../../../features/configuration/README.md)
- [Control](../../../features/control/README.md)
- [DX](../../../features/dx/README.md)
- [Runners](../../../features/runners/README.md)
- [Non-functionals](../../../features/non-functionals/README.md)

## 읽는 순서

1. 먼저 `feature-tables.md`
2. 해당 기능 영역의 대표 진입 문서
3. 필요할 때만 `docs/tasks/` 또는 `docs/tests/`

## 기본 원칙

- `docs/features/`는 기능 정의와 존재 이유를 담습니다
- `docs/tasks/`는 실행 세부 내용
- 각 기능 영역에는 분명한 진입 문서 하나가 있어야 함
- backlog를 여기로 복붙하지 말고 링크로 연결
