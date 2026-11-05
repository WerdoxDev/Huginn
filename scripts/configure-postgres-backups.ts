#!/usr/bin/env bun

import { createHash, randomBytes } from "node:crypto";
import { chmod, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { parseEnv } from "node:util";

import { repositoryRoot } from "./process";

const directory = resolve(repositoryRoot, ".data/postgres-backup");
const input = process.argv[2];
let dockerEnvironment = process.env;
let sshWrapper: string | undefined;
if (!input || input === "--help") {
   console.log("Usage: bun scripts/configure-postgres-backups.ts --local | <private-config.env> [--ssh-config <path>]");
   console.log("Uses the current Docker context. Builds and deploys locally; does not publish an image.");
   process.exit(input ? 0 : 1);
}

async function docker(args: string[], options: { stdin?: string; env?: Record<string, string>; quiet?: boolean } = {}): Promise<string> {
   const child = Bun.spawn(["docker", ...args], {
      cwd: repositoryRoot,
      env: { ...dockerEnvironment, ...options.env },
      stdin: options.stdin === undefined ? "ignore" : new Blob([options.stdin]),
      stdout: options.quiet ? "pipe" : "inherit",
      stderr: options.quiet ? "pipe" : "inherit",
   });
   const output = options.quiet ? new Response(child.stdout).text() : Promise.resolve("");
   const errors = options.quiet ? new Response(child.stderr).text() : Promise.resolve("");
   const [code, stdout, stderr] = await Promise.all([child.exited, output, errors]);
   if (code !== 0) throw new Error(`docker ${args[0]} ${args[1] ?? ""} failed${stderr ? `: ${stderr.trim()}` : ""}`);
   return stdout.trim();
}

async function privateFile(name: string, contents: string): Promise<void> {
   const path = resolve(directory, name);
   await Bun.write(path, contents);
   await chmod(path, 0o600);
}

async function configure(): Promise<void> {
   await mkdir(directory, { recursive: true, mode: 0o700 });
   await chmod(directory, 0o700);
   const values = input === "--local" ? {} : parseEnv(await Bun.file(resolve(repositoryRoot, input!)).text());
   const repository = values.RESTIC_REPOSITORY ?? "";
   const region = values.AWS_DEFAULT_REGION || "eu-central-1";
   if (input !== "--local") {
      if (!repository || !values.AWS_ACCESS_KEY_ID || !values.AWS_SECRET_ACCESS_KEY) {
         throw new Error("Config needs RESTIC_REPOSITORY, AWS_DEFAULT_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.");
      }
      const url = new URL(repository.slice(3));
      if (!repository.startsWith("s3:https://") || url.hostname !== `s3.${region}.amazonaws.com` || url.username || url.password || url.search || url.hash) {
         throw new Error("Use the HTTPS ResticRepository URL from the AWS CloudFormation outputs.");
      }
      if (values.AWS_SESSION_TOKEN) throw new Error("Temporary AWS credentials expire; use the restricted backup user's access key.");
   } else if (await Bun.file(resolve(directory, "config.json")).exists()) {
      const previous = await Bun.file(resolve(directory, "config.json")).json();
      if (previous.repository) throw new Error("Refusing to disable existing S3 replication with --local.");
   }
   const config = JSON.stringify({ repository, region, instance: values.BACKUP_INSTANCE || "midgard", cloudwatch: Boolean(repository) }, null, 2) + "\n";
   const credentials = repository
      ? `[default]\naws_access_key_id = ${values.AWS_ACCESS_KEY_ID}\naws_secret_access_key = ${values.AWS_SECRET_ACCESS_KEY}\n`
      : "[default]\n";
   const existing = new Set((await docker(["secret", "ls", "--format", "{{.Name}}"], { quiet: true })).split("\n"));
   const passwordPath = resolve(directory, "restic-password");
   if (!(await Bun.file(passwordPath).exists())) {
      if (existing.has("postgres_backup_password")) throw new Error("Restore .data/postgres-backup/restic-password from your password manager before configuring this existing backup repository.");
      await privateFile("restic-password", randomBytes(32).toString("hex") + "\n");
   }
   if (!existing.has("postgres_backup_password")) {
      await docker(["secret", "create", "postgres_backup_password", "-"], { stdin: await Bun.file(passwordPath).text(), quiet: true });
   }
   const names: Record<string, string> = {};
   for (const [key, contents] of [["aws", credentials], ["config", config]]) {
      const hash = createHash("sha256").update(contents!).digest("hex").slice(0, 12);
      const name = `postgres_backup_${key}_${hash}`;
      if (!existing.has(name)) await docker(["secret", "create", name, "-"], { stdin: contents, quiet: true });
      names[`POSTGRES_BACKUP_${key!.toUpperCase()}_SECRET`] = name;
   }
   for (const name of ["state", "repository", "cache"]) await docker(["volume", "create", `huginn_postgres_backup_${name}`], { quiet: true });
   await docker(["build", "-t", "huginn-postgres-backup:1", "-f", "Dockerfile.huginn-backup", "."]);
   const imageId = await docker(["image", "inspect", "huginn-postgres-backup:1", "--format", "{{.Id}}"], { quiet: true });
   const image = `huginn-postgres-backup:${imageId.replace("sha256:", "").slice(0, 12)}`;
   await docker(["image", "tag", "huginn-postgres-backup:1", image], { quiet: true });
   names.POSTGRES_BACKUP_IMAGE = image;
   await docker(["stack", "deploy", "--resolve-image", "never", "-c", "docker-stack.backup.yaml", "huginn-backups"], { env: names });
   await privateFile("config.json", config);
   await privateFile("credentials.ini", credentials);
   await privateFile("deploy.env", Object.entries(names).map(([key, value]) => `${key}=${value}`).join("\n") + "\n");
   console.log(repository ? "S3 backup configuration deployed. Check the first upload and restore verification in the service logs." : "Encrypted local snapshots deployed. S3 replication and AWS alerts still need AWS setup.");
   console.log("Recovery password: .data/postgres-backup/restic-password — save a copy in your password manager.");
   console.log("Logs: docker service logs --follow huginn-backups_postgres-backup");
}

try {
   const options = process.argv.slice(3);
   if (options.length) {
      if (options.length !== 2 || options[0] !== "--ssh-config") throw new Error("Expected --ssh-config <path>.");
      const configPath = resolve(options[1]!);
      const ssh = Bun.which("ssh");
      if (!ssh || !(await Bun.file(configPath).exists())) throw new Error("SSH binary or config file is missing.");
      sshWrapper = await mkdtemp(resolve(tmpdir(), "huginn-backup-ssh-"));
      await Bun.write(resolve(sshWrapper, "ssh"), '#!/bin/sh\nexec "$HUGINN_BACKUP_SSH_BINARY" -F "$HUGINN_BACKUP_SSH_CONFIG" "$@"\n');
      await chmod(resolve(sshWrapper, "ssh"), 0o700);
      dockerEnvironment = { ...process.env, PATH: `${sshWrapper}:${process.env.PATH}`, HUGINN_BACKUP_SSH_BINARY: ssh, HUGINN_BACKUP_SSH_CONFIG: configPath };
   }
   await configure();
} catch (error) {
   console.error(error instanceof Error ? error.message : "Backup configuration failed.");
   process.exitCode = 1;
} finally {
   if (sshWrapper) await rm(sshWrapper, { recursive: true, force: true });
}
