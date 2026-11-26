#!/usr/bin/env bun

import { repositoryRoot, runCommand } from "./process";

const stackName = "huginn-backend";
const backupStackName = "huginn-backups";

export async function redeploy(): Promise<number> {
   if (!process.env.RESTIC_REPOSITORY?.trim()) {
      console.error("Set RESTIC_REPOSITORY to your B2 S3 repository URL before redeploying.");
      return 1;
   }

   const removeStackExitCode = await runCommand(["docker", "stack", "rm", "--detach=false", stackName], { cwd: repositoryRoot });
   if (removeStackExitCode !== 0) return removeStackExitCode;

   await Bun.sleep(5000);

   await runCommand(["docker", "config", "rm", "caddy_config"], { cwd: repositoryRoot });
   const createConfigExitCode = await runCommand(["docker", "config", "create", "caddy_config", "Caddyfile"], { cwd: repositoryRoot });
   if (createConfigExitCode !== 0) return createConfigExitCode;

   const deployExitCode = await runCommand(
      ["docker", "stack", "deploy", "-c", "docker-stack.yaml", stackName, "--with-registry-auth", "--resolve-image", "never"],
      {
         cwd: repositoryRoot,
      },
   );
   if (deployExitCode !== 0) return deployExitCode;

   // Update backups in place so application stack removal never removes them.
   return await runCommand(
      ["docker", "stack", "deploy", "-c", "docker-stack.backup.yaml", backupStackName, "--with-registry-auth", "--resolve-image", "never"],
      { cwd: repositoryRoot },
   );
}

if (import.meta.main) {
   process.exitCode = await redeploy();
}
