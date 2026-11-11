import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

// Isolate module mocks and test JWT secrets from the live integration suite.
test("sticker routes, CDN uploads, and messages", async () => {
   const child = Bun.spawn(
      [process.execPath, "test", "./packages/huginn-server/src/tests/stickers.unit.cases.ts", "./packages/huginn-cdn/src/tests/sticker-image.cases.ts"],
      {
         cwd: fileURLToPath(new URL("../../../../", import.meta.url)),
         stdout: "pipe",
         stderr: "pipe",
      },
   );
   const [code, stdout, stderr] = await Promise.all([child.exited, new Response(child.stdout).text(), new Response(child.stderr).text()]);
   if (code !== 0) throw new Error(stdout + stderr);
   expect(code).toBe(0);
}, 15_000);
