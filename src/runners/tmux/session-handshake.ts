import { extractSessionId } from "../../agents/session-identity.ts";
import { logLatencyDebug, type LatencyDebugContext } from "../../control/latency-debug.ts";
import { sleep } from "../../shared/process.ts";
import { normalizePaneText } from "../../shared/transcript.ts";
import type { TmuxClient, TmuxPaneState } from "./client.ts";

const TRUST_PROMPT_POLL_INTERVAL_MS = 250;
const TRUST_PROMPT_MAX_WAIT_MS = 10_000;
const SESSION_BOOTSTRAP_POLL_INTERVAL_MS = 100;
const PASTE_SETTLE_POLL_INTERVAL_MS = 40;
const PASTE_SETTLE_QUIET_WINDOW_MS = 60;
const PASTE_SETTLE_MULTILINE_MAX_WAIT_MS = 800;
const PASTE_SETTLE_SINGLE_LINE_MAX_WAIT_MS = 80;
const SUBMIT_CONFIRM_POLL_INTERVAL_MS = 40;
const SUBMIT_CONFIRM_MAX_WAIT_MS = 160;

export async function submitTmuxSessionInput(params: {
  tmux: TmuxClient;
  sessionName: string;
  text: string;
  promptSubmitDelayMs: number;
  timingContext?: LatencyDebugContext;
}) {
  const prePasteState = await params.tmux.getPaneState(params.sessionName);
  await params.tmux.sendLiteral(params.sessionName, params.text);
  const preSubmitState = await waitForPanePasteSettlement({
    tmux: params.tmux,
    sessionName: params.sessionName,
    baseline: prePasteState,
    text: params.text,
    minDelayMs: params.promptSubmitDelayMs,
  });

  await params.tmux.sendKey(params.sessionName, "Enter");
  if (
    await waitForPaneSubmitConfirmation({
      tmux: params.tmux,
      sessionName: params.sessionName,
      baseline: preSubmitState,
    })
  ) {
    return;
  }

  logLatencyDebug("tmux-submit-enter-retry", params.timingContext, {
    sessionName: params.sessionName,
  });
  await params.tmux.sendKey(params.sessionName, "Enter");
  if (
    await waitForPaneSubmitConfirmation({
      tmux: params.tmux,
      sessionName: params.sessionName,
      baseline: preSubmitState,
    })
  ) {
    return;
  }

  logLatencyDebug("tmux-submit-unconfirmed", params.timingContext, {
    sessionName: params.sessionName,
  });
  throw new Error(
    "tmux submit was not confirmed after Enter. The pane state did not change, so clisbot did not treat the prompt as truthfully submitted.",
  );
}

export async function captureTmuxSessionIdentity(params: {
  tmux: TmuxClient;
  sessionName: string;
  promptSubmitDelayMs: number;
  captureLines: number;
  statusCommand: string;
  pattern: string;
  timeoutMs: number;
  pollIntervalMs: number;
}) {
  await submitTmuxSessionInput({
    tmux: params.tmux,
    sessionName: params.sessionName,
    text: params.statusCommand,
    promptSubmitDelayMs: params.promptSubmitDelayMs,
    timingContext: undefined,
  });
  let deadline = Date.now() + params.timeoutMs;

  while (Date.now() < deadline) {
    await sleep(params.pollIntervalMs);
    const snapshot = normalizePaneText(
      await params.tmux.capturePane(params.sessionName, params.captureLines),
    );
    if (hasTrustPrompt(snapshot)) {
      await dismissTrustPrompt({
        tmux: params.tmux,
        sessionName: params.sessionName,
        captureLines: params.captureLines,
      });
      deadline = Date.now() + params.timeoutMs;
      await submitTmuxSessionInput({
        tmux: params.tmux,
        sessionName: params.sessionName,
        text: params.statusCommand,
        promptSubmitDelayMs: params.promptSubmitDelayMs,
        timingContext: undefined,
      });
      continue;
    }

    const sessionId = extractSessionId(snapshot, params.pattern);
    if (sessionId) {
      return sessionId;
    }
  }

  return null;
}

export async function dismissTmuxTrustPromptIfPresent(params: {
  tmux: TmuxClient;
  sessionName: string;
  captureLines: number;
  startupDelayMs: number;
}) {
  const deadline = Date.now() + Math.max(TRUST_PROMPT_MAX_WAIT_MS, params.startupDelayMs);

  while (Date.now() <= deadline) {
    const snapshot = normalizePaneText(
      await params.tmux.capturePane(params.sessionName, params.captureLines),
    );
    if (!snapshot) {
      await sleep(TRUST_PROMPT_POLL_INTERVAL_MS);
      continue;
    }

    if (!hasTrustPrompt(snapshot)) {
      return;
    }

    await dismissTrustPrompt({
      tmux: params.tmux,
      sessionName: params.sessionName,
      captureLines: params.captureLines,
    });
  }
}

export async function waitForTmuxSessionBootstrap(params: {
  tmux: TmuxClient;
  sessionName: string;
  captureLines: number;
  startupDelayMs: number;
}) {
  const deadline = Date.now() + Math.max(params.startupDelayMs, SESSION_BOOTSTRAP_POLL_INTERVAL_MS);

  while (Date.now() <= deadline) {
    let snapshot = "";
    try {
      snapshot = normalizePaneText(
        await params.tmux.capturePane(params.sessionName, params.captureLines),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("can't find session:") || message.includes("no server running on ")) {
        return "";
      }
      throw error;
    }
    if (snapshot) {
      return snapshot;
    }

    await sleep(SESSION_BOOTSTRAP_POLL_INTERVAL_MS);
  }

  return "";
}

async function dismissTrustPrompt(params: {
  tmux: TmuxClient;
  sessionName: string;
  captureLines: number;
}) {
  await params.tmux.sendKey(params.sessionName, "Enter");

  const deadline = Date.now() + TRUST_PROMPT_MAX_WAIT_MS;
  while (Date.now() <= deadline) {
    await sleep(TRUST_PROMPT_POLL_INTERVAL_MS);
    const snapshot = normalizePaneText(
      await params.tmux.capturePane(params.sessionName, params.captureLines),
    );
    if (!snapshot || hasTrustPrompt(snapshot)) {
      continue;
    }

    return;
  }
}

async function waitForPaneSubmitConfirmation(params: {
  tmux: TmuxClient;
  sessionName: string;
  baseline: TmuxPaneState;
}) {
  const deadline = Date.now() + SUBMIT_CONFIRM_MAX_WAIT_MS;
  while (true) {
    const state = await params.tmux.getPaneState(params.sessionName);
    if (hasPaneStateChanged(params.baseline, state)) {
      return true;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return false;
    }
    await sleep(Math.min(SUBMIT_CONFIRM_POLL_INTERVAL_MS, remainingMs));
  }
}

async function waitForPanePasteSettlement(params: {
  tmux: TmuxClient;
  sessionName: string;
  baseline: TmuxPaneState;
  text: string;
  minDelayMs: number;
}) {
  await sleep(params.minDelayMs);

  let currentState = await params.tmux.getPaneState(params.sessionName);
  let sawChange = hasPaneStateChanged(params.baseline, currentState);
  let lastChangeAt = Date.now();
  const deadline =
    Date.now() +
    (shouldWaitForVisiblePaste(params.text)
      ? PASTE_SETTLE_MULTILINE_MAX_WAIT_MS
      : PASTE_SETTLE_SINGLE_LINE_MAX_WAIT_MS);

  while (true) {
    if (sawChange && Date.now() - lastChangeAt >= PASTE_SETTLE_QUIET_WINDOW_MS) {
      return currentState;
    }

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      return currentState;
    }

    await sleep(Math.min(PASTE_SETTLE_POLL_INTERVAL_MS, remainingMs));
    const nextState = await params.tmux.getPaneState(params.sessionName);
    if (!arePaneStatesEqual(currentState, nextState)) {
      currentState = nextState;
      if (hasPaneStateChanged(params.baseline, currentState)) {
        sawChange = true;
      }
      lastChangeAt = Date.now();
    }
  }
}

function hasPaneStateChanged(left: TmuxPaneState, right: TmuxPaneState) {
  return (
    left.cursorX !== right.cursorX ||
    left.cursorY !== right.cursorY ||
    left.historySize !== right.historySize
  );
}

function arePaneStatesEqual(left: TmuxPaneState, right: TmuxPaneState) {
  return (
    left.cursorX === right.cursorX &&
    left.cursorY === right.cursorY &&
    left.historySize === right.historySize
  );
}

function looksLikeClaudeTrustPrompt(snapshot: string) {
  return (
    snapshot.includes("Quick safety check:") &&
    snapshot.includes("Yes, I trust this folder")
  ) || snapshot.includes("Enter to confirm · Esc to cancel");
}

function hasTrustPrompt(snapshot: string) {
  return (
    snapshot.includes("Do you trust the contents of this directory?") ||
    snapshot.includes("Press enter to continue") ||
    looksLikeClaudeTrustPrompt(snapshot)
  );
}

function shouldWaitForVisiblePaste(text: string) {
  return text.includes("\n");
}
