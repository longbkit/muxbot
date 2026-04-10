import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  ensureMuxbotWrapper,
  getMuxbotWrapperPath,
  renderMuxbotWrapperScript,
} from "../src/control/muxbot-wrapper.ts";

describe("muxbot wrapper", () => {
  let tempDir = "";
  let previousWrapperPath: string | undefined;

  afterEach(() => {
    process.env.MUXBOT_WRAPPER_PATH = previousWrapperPath;
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("creates a stable local wrapper script at the configured path", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "muxbot-wrapper-"));
    previousWrapperPath = process.env.MUXBOT_WRAPPER_PATH;
    process.env.MUXBOT_WRAPPER_PATH = join(tempDir, "bin", "muxbot");

    const wrapperPath = await ensureMuxbotWrapper();

    expect(wrapperPath).toBe(process.env.MUXBOT_WRAPPER_PATH);
    expect(getMuxbotWrapperPath()).toBe(process.env.MUXBOT_WRAPPER_PATH);
    expect(readFileSync(wrapperPath, "utf8")).toBe(renderMuxbotWrapperScript());
  });

  test("rewrites a stale wrapper body in place", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "muxbot-wrapper-"));
    previousWrapperPath = process.env.MUXBOT_WRAPPER_PATH;
    process.env.MUXBOT_WRAPPER_PATH = join(tempDir, "bin", "muxbot");
    await Bun.write(process.env.MUXBOT_WRAPPER_PATH, "#!/usr/bin/env bash\necho stale\n");

    await ensureMuxbotWrapper();

    expect(readFileSync(process.env.MUXBOT_WRAPPER_PATH!, "utf8")).toBe(
      renderMuxbotWrapperScript(),
    );
    expect(dirname(process.env.MUXBOT_WRAPPER_PATH!)).toBe(join(tempDir, "bin"));
  });
});
