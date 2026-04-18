import { describe, expect, test } from "bun:test";
import { runAccountsCli } from "../src/control/accounts-cli.ts";

describe("accounts cli", () => {
  test("fails fast and redirects operators to the official bots surface", async () => {
    await expect(runAccountsCli([])).rejects.toThrow("Use `clisbot bots ...` instead.");
    await expect(runAccountsCli(["help"])).rejects.toThrow(
      "Use `clisbot bots ...` instead.",
    );
  });
});
