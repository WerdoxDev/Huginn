#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { chmod, mkdir, rename, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

import { repositoryRoot } from "./process";

const source = process.argv[2] ?? "secrets.env";
if (source === "--help") {
   console.log("Usage: bun scripts/backup-neon.ts [source.env] [backup-directory]");
   process.exit(0);
}

const directory = resolve(repositoryRoot, process.argv[3] ?? ".data/backups");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const archive = resolve(directory, `neon-${timestamp}.dump`);
const partial = `${archive}.partial`;

async function backup(): Promise<void> {
   const values = parseEnv(await Bun.file(resolve(repositoryRoot, source)).text());
   if (!values.POSTGRESQL_URL) throw new Error("Source file must contain POSTGRESQL_URL.");
   const url = new URL(values.POSTGRESQL_URL);
   if (!url.hostname.endsWith(".neon.tech")) throw new Error("Expected a Neon source database.");
   // A direct connection preserves the session settings used by pg_dump.
   const host = url.hostname.replace("-pooler.", ".");
   const env = {
      ...process.env,
      PGHOST: host,
      PGPORT: url.port || "5432",
      PGUSER: decodeURIComponent(url.username),
      PGPASSWORD: decodeURIComponent(url.password),
      PGDATABASE: decodeURIComponent(url.pathname.slice(1)),
      PGSSLMODE: "require",
      PGCONNECT_TIMEOUT: "15",
      PGAPPNAME: "huginn-backup",
   };
   await mkdir(directory, { recursive: true, mode: 0o700 });
   // pg_dump opens this existing private file without changing its permissions.
   await Bun.write(partial, "");
   await chmod(partial, 0o600);
   console.log(`Backing up ${host} to ${archive}`);
   const dump = Bun.spawn(
      ["pg_dump", "--format=custom", "--no-owner", "--no-acl", "--lock-wait-timeout=30s", "--file", partial],
      { env, stdout: "inherit", stderr: "inherit" },
   );
   if ((await dump.exited) !== 0) throw new Error("Neon export failed; no completed backup was created.");
   const check = Bun.spawn(["pg_restore", "--list", partial], { stdout: "ignore", stderr: "inherit" });
   if ((await check.exited) !== 0) throw new Error("Archive validation failed.");
   await rename(partial, archive);
   const hash = createHash("sha256");
   for await (const chunk of createReadStream(archive)) hash.update(chunk);
   const sha256 = hash.digest("hex");
   await Bun.write(`${archive}.sha256`, `${sha256}  ${archive.split("/").pop()}\n`);
   console.log(`Backup complete; archive verified. SHA-256: ${sha256}`);
}

try {
   await backup();
} catch (error) {
   await unlink(partial).catch(() => {});
   console.error(error instanceof Error ? error.message : "Backup failed.");
   process.exitCode = 1;
}
