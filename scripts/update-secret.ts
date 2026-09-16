#!/usr/bin/env bun

import { repositoryRoot, runCommand } from "./process";
import { redeploy } from "./redeploy";

await runCommand(["docker", "stack", "rm", "huginn-backend"], { cwd: repositoryRoot });
await runCommand(["docker", "secret", "rm", "backend_secrets"], { cwd: repositoryRoot });
await runCommand(["docker", "secret", "create", "backend_secrets", "secrets.env"], { cwd: repositoryRoot });

process.exitCode = await redeploy();
