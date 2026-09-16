#!/usr/bin/env bun

import { repositoryRoot, runCommand } from "./process";

const stackName = "huginn-backend";

export async function redeploy(): Promise<number> {
   await runCommand(["docker", "stack", "rm", stackName], { cwd: repositoryRoot });
   await runCommand(["docker", "config", "rm", "caddy_config"], { cwd: repositoryRoot });
   await runCommand(["docker", "config", "create", "caddy_config", "Caddyfile"], { cwd: repositoryRoot });

   return await runCommand(["docker", "stack", "deploy", "-c", "docker-stack.yaml", stackName, "--with-registry-auth"], {
      cwd: repositoryRoot,
   });
}

if (import.meta.main) {
   process.exitCode = await redeploy();
}
