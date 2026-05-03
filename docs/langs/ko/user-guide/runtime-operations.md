[English](../../../user-guide/runtime-operations.md) | [한국어](./runtime-operations.md)

# Runtime 운영

## Turn 실행 timeout

이 설정들은 한 번의 prompt turn을 제어합니다. 장기적인 tmux session 정리와는 별개입니다.

현재 설정 지점:

- `agents.defaults.stream.idleTimeoutMs`
- `agents.defaults.stream.noOutputTimeoutMs`
- `agents.defaults.stream.maxRuntimeMin`
- `agents.defaults.stream.maxRuntimeSec`
- `agents.list[].stream.*`

현재 의미:

- `idleTimeoutMs: 6000`
  - turn이 이미 보이는 output을 낸 뒤, 6초 동안 meaningful runner activity가 더 없으면 turn을 완료로 봄
- `noOutputTimeoutMs: 20000`
  - 내부 진단용 임계치일 뿐이며
  - turn을 settle하거나 chat에 timeout을 표시하지는 않음
- `maxRuntimeMin: 30`
  - 한 turn의 기본 관찰 창은 30분
  - 그 뒤에도 session이 active면 live follow는 멈추고 session은 계속 살아 있으며, final 결과는 나중에 여기 다시 게시됨
- `maxRuntimeSec`
  - 더 짧은 테스트나 세밀한 제어가 필요할 때 쓰는 초 단위 관찰 창

구분해야 할 점:

- 이 값들은 streaming settlement와 turn completion에 영향
- turn 뒤 tmux session이 계속 살아 있을지 여부는 결정하지 않음
- stale tmux cleanup은 `session.staleAfterMinutes`, `control.sessionCleanup.*`가 따로 담당
- detached long-running session은 이후 interactive turn이나 stop action이 detached 상태를 지우기 전까지 stale cleanup 대상이 아님

## Long-running session command

초기 관찰 창을 넘겨도 run은 계속 감시되며, thread를 여러 방식으로 붙여 둘 수 있습니다.

현재 command:

- `/attach`
  - 이 thread를 active run에 붙임
  - run이 아직 진행 중이면 live update가 여기서 재개됨
  - 이미 settle된 경우 최신 settled state 하나를 보여 줌
- `/detach`
  - 이 thread의 live update는 멈춤
  - underlying run은 계속 감
  - final 결과는 여기에 계속 게시됨
- `/watch every 30s`
  - 완료될 때까지 30초마다 최신 상태 게시
- `/watch every 30s for 10m`
  - 같은 동작이지만 지정한 시간 창 뒤에는 중단

현재 prompt admission rule:

- session에 active run이 있으면, 그 run이 settle되거나 interrupt되기 전까지 새 prompt는 거부됩니다
- 이때는 두 번째 prompt를 보내기보다 `/attach`, `/watch`, `/stop`을 쓰는 편이 맞습니다

현재 observer scope rule:

- observer mode는 routed conversation 안의 thread 단위
- 같은 thread에서 `/attach`나 `/watch ...`를 다시 실행하면 기존 observer mode를 대체

현재 status visibility:

- `/status`는 routed session이 `idle`, `running`, `detached` 중 무엇인지 표시
- 가능하면 `run.startedAt`, `run.detachedAt`도 표시
- `clisbot status`도 active run을 보여 주므로 detached autonomous session을 보려면 `/transcript`나 re-attach가 꼭 필요하지 않음

## `clisbot` tmux server

`clisbot`은 시스템 기본 tmux server를 쓰지 않습니다.

전용 socket으로 자기 tmux server를 띄워 관리합니다.

`~/.clisbot/state/clisbot.sock`

따라서 일반 `tmux list-sessions`로는 `clisbot` session이 보이지 않습니다.

## 자주 쓰는 명령

우선 runner CLI를 쓰는 편이 좋습니다.

```bash
clisbot runner list
clisbot runner inspect --latest
clisbot runner inspect --index 1
clisbot runner watch --latest --lines 20 --interval 1s
clisbot runner watch --next --timeout 120s --lines 20 --interval 1s
clisbot inspect --latest
clisbot watch --latest
```

의미:

- `inspect --latest`: 가장 최근에 새 prompt를 admit한 session snapshot
- `watch --latest`: 가장 최근에 새 prompt를 admit한 session을 따라감
- `watch --next`: command 시작 뒤 처음 admit된 새 prompt를 기다렸다가 그 session을 따라감
- `--index`: `clisbot runner list`가 보여 준 1-based 순서

Raw tmux fallback:

```bash
tmux -S ~/.clisbot/state/clisbot.sock list-sessions
tmux -S ~/.clisbot/state/clisbot.sock attach-session -t <session-name>
tmux -S ~/.clisbot/state/clisbot.sock kill-session -t <session-name>
tmux -S ~/.clisbot/state/clisbot.sock kill-server
```

## Runtime 상태 파일

중요한 경로:

- config: `~/.clisbot/clisbot.json`
- tmux socket: `~/.clisbot/state/clisbot.sock`
- monitor pid: `~/.clisbot/state/clisbot.pid`
- monitor state: `~/.clisbot/state/clisbot-monitor.json`
- runtime log: `~/.clisbot/state/clisbot.log`
- session store: `~/.clisbot/state/sessions.json`
- activity store: `~/.clisbot/state/activity.json`
- pairing store: `~/.clisbot/state/pairing`

유용한 확인:

```bash
clisbot runner list
clisbot inspect --latest
clisbot watch --latest --lines 20 --interval 1s
tail -f ~/.clisbot/state/clisbot.log
```

## Runtime monitor

detached `clisbot start`는 이제 app-owned runtime monitor 아래에서 실행됩니다.

현재 동작:

- `clisbot.pid`는 monitor process pid
- `clisbot status`는 monitor 상태, 현재 runtime pid, backoff 중이면 `next restart` 표시
- runtime worker가 반복 crash되면 bounded backoff로 자동 retry
- stale worker만 남고 live monitor가 사라진 경우 `stop`과 다음 `start`가 정리
- update 중 `clisbot restart`가 stop timeout을 출력하면 먼저 `clisbot status`를 확인
- 이미 `running: no`라면 `clisbot start`로 명시적 복구

Telegram polling conflict:

- 같은 bot token으로 다른 process가 `getUpdates`를 쓰고 있어도 runtime 안에서 backoff retry
- conflict 동안 channel health는 `failed`, 복구되면 자동으로 `active`

Codex trust prompt troubleshooting:

- `clisbot`은 Codex에 대해 기본적으로 `trustWorkspace: true`
- fresh startup은 interactive `›` prompt marker를 본 뒤 첫 routed prompt를 보냄
- trust screen이 지연되어도, 첫 routed prompt나 이후 steering 전에 다시 한 번 받아 주도록 보강됨
- 여전히 `Do you trust the contents of this directory?`가 뜬다면 `~/.codex/config.toml`에 workspace를 trusted로 표시하는 것도 확인

```toml
[projects."/home/node/.clisbot/workspaces/default"]
trust_level = "trusted"
```

## Stale tmux cleanup

`clisbot`은 논리 대화를 끊지 않으면서 idle tmux session을 회수할 수 있습니다.

현재 설정:

- `agents.defaults.session.staleAfterMinutes`
- `agents.list[].session.staleAfterMinutes`
- `control.sessionCleanup.enabled`
- `control.sessionCleanup.intervalMinutes`

현재 의미:

- `staleAfterMinutes: 60`: 60분 idle이면 live tmux runner kill
- `staleAfterMinutes: 0`: 해당 agent에 대해 cleanup 비활성화
- `control.sessionCleanup.intervalMinutes: 5`: 5분마다 stale runner scan

중요한 규칙:

- stale cleanup은 live tmux session만 죽임
- `~/.clisbot/state/sessions.json`의 `sessionKey -> sessionId` 저장 매핑은 지우지 않음
- startup retry, prompt-delivery retry, same-context recovery도 이 매핑을 유지
- native `sessionId`를 resume하지 못하면 `clisbot`은 새 대화를 몰래 만들지 않고 truthfully fail함
- `clisbot runner list`의 `sessionId: not stored`는 아직 저장된 값이 없다는 뜻
- 의도적으로 새 runner conversation이 필요하면 chat `/new`를 사용

## Config reload

config reload는 다음이 담당합니다.

- `control.configReload.watch`
- `control.configReload.watchDebounceMs`

의미:

- `watch: true`면 `~/.clisbot/clisbot.json` watcher 활성화
- `watchDebounceMs`는 한 번의 save가 여러 번 reload를 일으키지 않도록 짧게 지연

중요한 규칙:

- 현재 watch가 꺼져 있다면, 파일을 바꿔 watch를 켜더라도 watcher 자체가 없으므로 한 번은 수동 restart가 필요
- watch가 켜진 뒤에는 이후 config save가 자동 reload되어야 함

Runtime follow-up state는 `sessionKey`별로 `~/.clisbot/state/sessions.json`에 저장됩니다.

유용한 필드:

- `sessionId`
- `followUp.overrideMode`
- `followUp.lastBotReplyAt`
- `updatedAt`

현재 기본 follow-up window는 5분:

- `bots.slack.defaults.followUp.participationTtlMin: 5`
- `bots.telegram.defaults.followUp.participationTtlMin: 5`

초 단위 tuning도 지원:

- `bots.slack.defaults.followUp.participationTtlSec`
- `bots.telegram.defaults.followUp.participationTtlSec`
