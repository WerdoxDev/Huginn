import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const app = "packages/huginn-app";
const appSources = [`${app}/src`, `${app}/electron`, `${app}/shared`];
const modes = ["lint", "format", "whitespace", "typecheck", "test"];
const mode = process.argv[2];
if (mode && !modes.includes(mode)) {
   console.error(`Unknown check: ${mode}. Choose ${modes.join(", ")}.`);
   process.exit(1);
}

function git(args) {
   const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
   if (result.error || result.status !== 0) {
      console.error(result.error?.message ?? result.stderr);
      process.exit(result.status || 1);
   }
   return result.stdout;
}

function run(label, command, args, successCodes = [0]) {
   console.log(`\n[check] ${label}`);
   const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
   if (result.error || result.signal) {
      console.error(result.error?.message ?? `Terminated by ${result.signal}`);
      return 1;
   }
   const status = successCodes.includes(result.status) ? 0 : (result.status ?? 1);
   console.log(`[check] ${label}: ${status === 0 ? "passed" : `failed (exit ${status})`}`);
   return status;
}

// HEAD checks local edits; CI supplies the PR base or previous pushed revision.
const requestedBase = process.env.CHECK_BASE_REF || "HEAD";
const base = /^0+$/.test(requestedBase) ? "HEAD^" : requestedBase;
git(["rev-parse", "--verify", `${base}^{commit}`]);
const inScope = (path) => path.startsWith(`${app}/`) || !path.startsWith("packages/");
const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"])
   .split("\0")
   .filter(Boolean)
   .filter(inScope)
   .filter((path) => {
      // An index deletion can leave an unchanged HEAD file appearing as untracked.
      const original = spawnSync("git", ["rev-parse", "--verify", `${base}:${path}`], { cwd: root, encoding: "utf8" });
      return original.status !== 0 || original.stdout.trim() !== git(["hash-object", "--", path]).trim();
   });
const changed = [...new Set([...git(["diff", "--name-only", "--diff-filter=ACMR", "-z", base, "--"]).split("\0"), ...untracked])]
   .filter(Boolean)
   .filter(inScope)
   .filter((path) => existsSync(resolve(root, path)));

const checks = {
   lint() {
      const tooling = changed.filter((path) => !path.startsWith("packages/") && /\.[cm]?[jt]sx?$/.test(path));
      return run("lint", "pnpm", ["exec", "oxlint", ...appSources, ...tooling]);
   },
   format() {
      const files = changed.filter((path) => /\.(?:[cm]?[jt]sx?|jsonc?|ya?ml|md|css|html)$/.test(path));
      if (!files.length) {
         console.log("[check] format: no changed files to format");
         return 0;
      }
      return run("format changed files", "pnpm", ["exec", "oxfmt", "--check", ...files]);
   },
   whitespace() {
      // Match the formatter's CRLF policy without changing the user's Git config.
      if (!changed.length) {
         console.log("[check] whitespace: no changed files to check");
         return 0;
      }
      const status = run("whitespace", "git", ["-c", "core.whitespace=cr-at-eol", "diff", "--check", base, "--", ...changed]);
      if (status) return status;
      for (const path of untracked) {
         // --no-index returns 1 for a clean difference and 2 for whitespace errors.
         const result = run(`whitespace ${path}`, "git", ["-c", "core.whitespace=cr-at-eol", "diff", "--no-index", "--check", "--", "/dev/null", path], [0, 1]);
         if (result) return result;
      }
      return 0;
   },
   typecheck() {
      return run("app typecheck", "pnpm", ["--dir", app, "run", "typecheck"]);
   },
   test() {
      return run("app tests", "pnpm", ["--dir", app, "run", "test:run"]);
   },
};

for (const name of mode ? [mode] : modes) {
   const status = checks[name]();
   if (status) process.exit(status);
}
