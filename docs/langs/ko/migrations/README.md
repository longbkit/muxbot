[English](../../../migrations/README.md) | [Tiếng Việt](../../vi/migrations/README.md) | [简体中文](../../zh-CN/migrations/README.md) | [한국어](./README.md)

# 수동 마이그레이션

## 목적

`docs/migrations/`는 업그레이드 과정에서 운영자의 수동 작업이 필요한 경우에만 사용합니다.

agent나 bot의 업데이트 흐름에서는:

- 먼저 [index.md](./index.md)를 읽고
- 수동 작업이 없으면 별도 migration runbook이 필요하지 않습니다

## 구조

- [index.md](./index.md): agent가 읽기 쉬운 짧은 판단 파일
- `vA.B.C-to-vX.Y.Z.md`: 실제 수동 절차가 필요할 때의 runbook
- [templates/migration.md](./templates/migration.md): 템플릿

## 작성 규칙

다음 항목 중 하나라도 자동이 아니거나 안전하지 않을 때만 별도의 migration 문서를 만듭니다.

- manual action
- update path
- breaking change
- rollback
- intermediate version

## 현재 상태

현재 안정 버전 업데이트 경로 중 별도의 수동 migration runbook이 필요한 경우는 없습니다.
