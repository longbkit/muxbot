[English](../../../overview/specs-review-checklist-draft.md) | [Tiếng Việt](../../vi/overview/specs-review-checklist-draft.md) | [简体中文](../../zh-CN/overview/specs-review-checklist-draft.md) | [한국어](./specs-review-checklist-draft.md)

# 스펙 리뷰 체크리스트 초안

## 상태

초안

실험적인 리뷰 보조 도구입니다.

아직 저장소의 공식 표준은 아닙니다.

## 목적

구현이 굳어지기 전에 feature spec을 빠르게 점검할 때 이 체크리스트를 사용합니다.

이 문서는 다음 상태를 유지하도록 설계되었습니다.

- 짧을 것
- 실무 리뷰에 충분할 만큼은 구분이 잘 될 것
- 팀이 배우면서 계속 고치기 쉬울 것

## 리뷰 상태 라벨

리뷰할 spec 또는 guide의 맨 위에 다음 라벨 중 하나를 붙입니다.

- `explore`
- `spec-ready`
- `alpha`
- `beta`
- `official`

상태 자체가 모호하다면 그 spec은 아직 리뷰할 준비가 안 된 것입니다.

## 7개의 점검 게이트

### 1. 결과

- 사용자 또는 operator 가치가 분명한가?
- 이 문제를 지금 푸는 것이 맞는가?
- user guide가 여전히 약하다면, 이 feature는 취소하거나 다시 범위를 줄여야 하지 않는가?

### 2. 행위자와 Surface

- 어떤 사용자 유형 또는 역할이 관련되는가?
- 각 동작은 어느 surface가 소유하는가: user guide, prompt, slash command, routed runtime, operator CLI, config?
- 누가 어디서 무엇을 할 수 있는가?

### 3. 동작과 강제 규칙

- 현재 동작은 무엇인가?
- 목표 동작은 무엇인가?
- 어느 부분이 안내 수준인가?
- 어느 부분이 강제 규칙인가?
- 해석 및 적용 순서가 명시되어 있는가?

### 4. 기본값과 안전성

- 기본값과 fallback은 안전한가?
- 중립적으로 보이는 fallback이 특권 상태로 오해될 수는 없는가?
- 보호 경계가 분명한가: 수정 가능한 template와 보호된 prompt block, route-local 규칙과 전역 auth가 명확히 나뉘는가?

### 5. Operator 흐름

- 실제 operator가 아키텍처 배경지식 없이도 핵심 흐름을 끝낼 수 있는가?
- 추가, 제거, 변경, debug 흐름이 모두 다뤄졌는가?
- 거부 또는 실패 경로가 분명하고 행동 가능하게 쓰였는가?

### 6. 전환과 위험

- 호환 정책이 분명한가: compatibility mode, migration, 아니면 fail-fast replacement인가?
- 주요 회귀 위험이 이름 붙여졌는가?
- 모호한 구버전 대 신버전 동작이 남아 있지는 않은가?

### 7. 증거와 성숙도

- 필요할 때 개발자용 spec과 사용자 또는 operator용 guide가 모두 있는가?
- 문구가 계획상의 target truth가 아니라 현재 runtime truth와 맞는가?
- 성숙도 라벨이 정직한가?
- 현재 라벨에 비해 검증 계획이 충분한가?

## 빠른 판정

보통 다음을 만족하면 spec 상태가 좋은 편입니다.

- 7개 게이트 모두 답이 분명하다
- 어떤 게이트도 숨은 가정에 기대지 않는다
- user guide와 dev spec이 같은 이야기를 한다
- 상태 라벨이 현실과 맞는다

멈춰야 할 신호:

- 가치가 여전히 충분히 설득되지 않는다
- operator 흐름이 여전히 흐릿하다
- 안내용 동작과 강제 동작이 아직 뒤섞여 있다
- fallback 의미가 여전히 위험하게 느껴진다
- guide가 너무 약해서 이 feature 자체가 출시할 가치가 없을 수 있다

## 메모

- 이 체크리스트는 리뷰용이지, feature docs나 task docs를 대체하려는 것이 아닙니다.
- 같은 누락 항목을 반복해서 잡아낸다면, 그 규칙을 나중에 spec template로 올리면 됩니다.
