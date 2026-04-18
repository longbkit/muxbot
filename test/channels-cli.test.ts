import { describe, expect, test } from "bun:test";
import { runChannelsCli } from "../src/control/channels-cli.ts";

describe("channels cli", () => {
  test("fails fast and redirects operators to the official routes and bots surfaces", async () => {
    await expect(runChannelsCli([])).rejects.toThrow(
      "Use `clisbot routes ...` for route management and `clisbot bots ...` for bot management.",
    );
    await expect(runChannelsCli(["help"])).rejects.toThrow(
      "Use `clisbot routes ...` for route management and `clisbot bots ...` for bot management.",
    );
  });
});
