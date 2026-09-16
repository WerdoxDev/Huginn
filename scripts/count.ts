#!/usr/bin/env bun

import { runCommand } from "./process";

if (!Bun.which("cloc")) {
   console.error("cloc is not installed. Please install cloc and ensure it is in your PATH.");
   process.exitCode = 1;
} else {
   process.exitCode = await runCommand(["cloc", "--vcs=git", "."]);
}
