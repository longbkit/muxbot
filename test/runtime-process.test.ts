import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getRuntimeStatus, readRuntimeLog, readRuntimePid } from "../src/control/runtime-process.ts";

const tempDirs: string[] = [];
const originalClisbotConfigPath = process.env.CLISBOT_CONFIG_PATH;
const originalClisbotHome = process.env.CLISBOT_HOME;
const originalClisbotPidPath = process.env.CLISBOT_PID_PATH;
const originalClisbotLogPath = process.env.CLISBOT_LOG_PATH;

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { force: true, recursive: true });
  }
  process.env.CLISBOT_CONFIG_PATH = originalClisbotConfigPath;
  process.env.CLISBOT_HOME = originalClisbotHome;
  process.env.CLISBOT_PID_PATH = originalClisbotPidPath;
  process.env.CLISBOT_LOG_PATH = originalClisbotLogPath;
});

function createTempDir() {
  const dir = mkdtempSync(join(tmpdir(), "clisbot-runtime-process-test-"));
  tempDirs.push(dir);
  return dir;
}

describe("readRuntimeLog", () => {
  test("limits output to text written after the provided start offset", async () => {
    const dir = createTempDir();
    const logPath = join(dir, "clisbot.log");
    writeFileSync(logPath, "old stack line\nold stack line 2\n");
    const startOffset = Bun.file(logPath).size;
    writeFileSync(logPath, "fresh line 1\nfresh line 2\n", { flag: "a" });

    const result = await readRuntimeLog({
      logPath,
      startOffset,
      lines: 40,
    });

    expect(result.text).toBe("fresh line 1\nfresh line 2");
  });
});

describe("runtime path defaults", () => {
  test("uses CLISBOT_* env vars when explicit paths are omitted", async () => {
    const dir = createTempDir();
    const configPath = join(dir, "custom-config.json");
    const pidPath = join(dir, "custom.pid");
    const logPath = join(dir, "custom.log");

    writeFileSync(configPath, "{}\n");
    writeFileSync(pidPath, "12345\n");
    writeFileSync(logPath, "runtime log\n");

    process.env.CLISBOT_CONFIG_PATH = configPath;
    process.env.CLISBOT_PID_PATH = pidPath;
    process.env.CLISBOT_LOG_PATH = logPath;

    expect(await readRuntimePid()).toBe(12345);

    const status = await getRuntimeStatus();
    expect(status.configPath).toBe(configPath);
    expect(status.pidPath).toBe(pidPath);
    expect(status.logPath).toBe(logPath);
  });

  test("uses CLISBOT_HOME for default runtime paths", async () => {
    const dir = createTempDir();
    const clisbotHome = join(dir, ".clisbot-dev");
    const pidPath = join(clisbotHome, "state", "clisbot.pid");

    mkdirSync(join(clisbotHome, "state"), { recursive: true });
    writeFileSync(pidPath, "12345\n", { flag: "w" });
    delete process.env.CLISBOT_CONFIG_PATH;
    delete process.env.CLISBOT_PID_PATH;
    delete process.env.CLISBOT_LOG_PATH;
    process.env.CLISBOT_HOME = clisbotHome;

    expect(await readRuntimePid()).toBe(12345);

    const status = await getRuntimeStatus();
    expect(status.configPath).toBe(join(clisbotHome, "clisbot.json"));
    expect(status.pidPath).toBe(pidPath);
    expect(status.logPath).toBe(join(clisbotHome, "state", "clisbot.log"));
    expect(status.tmuxSocketPath).toBe(join(clisbotHome, "state", "clisbot.sock"));
  });
});
