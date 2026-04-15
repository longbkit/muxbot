import { parseCliArgs } from "../cli.ts";

export function printCommandOutcomeBanner(outcome: "success" | "failure") {
  console.log("");
  console.log("+---------+");
  console.log(outcome === "success" ? "| SUCCESS |" : "| FAILED  |");
  console.log("+---------+");
  console.log("");
}

export function printCommandOutcomeFooter(outcome: "success" | "failure") {
  printCommandOutcomeBanner(outcome);
}

export function assertSupportedPlatform(command: ReturnType<typeof parseCliArgs>) {
  if (process.platform !== "win32") {
    return;
  }

  if (command.name === "help" || command.name === "version") {
    return;
  }

  throw new Error(
    "Native Windows is not supported yet. Run clisbot from WSL2 or use Linux/macOS instead.",
  );
}
