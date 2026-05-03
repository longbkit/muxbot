[English](../../../overview/README.md) | [Tiếng Việt](../../vi/overview/README.md) | [简体中文](../../zh-CN/overview/README.md) | [한국어](./README.md)

# 프로젝트 개요

## 목적

`docs/overview/`는 다음을 빠르게 이해하기 위한 문서 묶음입니다.

- 이 프로젝트가 무엇인지
- 어떤 목표를 가지는지
- 다른 문서가 반드시 존중해야 하는 원문 요구사항이 무엇인지

## 주요 파일

- [human-requirements.md](./human-requirements.md): 원문 인간 요구사항 메모의 한국어 mirror
- [launch-mvp-path.md](./launch-mvp-path.md): 현재 출시 순서
- [prioritization.md](./prioritization.md): 우선순위 판단 기준
- [specs-review-checklist-draft.md](./specs-review-checklist-draft.md): 스펙 리뷰 체크리스트 초안

## 프로젝트 목표

`clisbot`은 긴 수명의 AI coding agent를 위한 커뮤니케이션 브리지입니다.

핵심 아이디어는 다음과 같습니다.

- 하나의 AI coding CLI를 하나의 지속형 tmux session으로 실행
- 그 agent를 Slack, Telegram, 이후의 다양한 대화 채널로 노출
- 사용자가 subscription 기반 coding CLI를 API-only 방식보다 더 저렴하고 현실적으로 활용
- tmux를 현재 안정성과 확장성의 핵심 경계로 유지

## 현재 MVP

- Slack Socket Mode
- tmux-backed agents
- TypeScript + Bun
- 하나의 agent workspace를 여러 conversation session이 재사용
- 기본 workspace: `~/.clisbot/workspaces/default`
- 기본 config: `~/.clisbot/clisbot.json`
