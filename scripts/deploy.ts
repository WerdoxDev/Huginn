#!/usr/bin/env bun

import { repositoryRoot, runCommand } from "./process";

type Package = {
   key: string;
   image: string;
   dockerfile: string;
};

const stackName = "huginn-backend";
const packages: Package[] = [
   { key: "caddy", image: "ghcr.io/werdoxdev/caddy", dockerfile: "Dockerfile.caddy" },
   { key: "huginn-server", image: "ghcr.io/werdoxdev/huginn-server", dockerfile: "Dockerfile.huginn-server" },
   { key: "huginn-cdn", image: "ghcr.io/werdoxdev/huginn-cdn", dockerfile: "Dockerfile.huginn-cdn" },
   { key: "huginn-voice", image: "ghcr.io/werdoxdev/huginn-voice", dockerfile: "Dockerfile.huginn-voice" },
];

function printUsage(): void {
   console.log("Usage: bun scripts/deploy.ts [nopush|local] [skip:pkg1,pkg2,...] [help]");
   console.log();
   console.log("  nopush / local   Build only, do not push or use registry auth on deploy");
   console.log("  skip:pkg,...     Skip building (and pushing) the listed packages");
   console.log();
   console.log("Available package keys:");
   for (const packageDefinition of packages) console.log(`  - ${packageDefinition.key}`);
}

function printFailure(): void {
   console.error();
   console.error("========================================");
   console.error("ERROR: Deployment failed!");
   console.error("========================================");
}

async function deploy(): Promise<number> {
   let pushToRegistry = true;
   const skippedPackages = new Set<string>();
   const packageKeys = new Set(packages.map(({ key }) => key));

   for (const argument of process.argv.slice(2)) {
      const normalizedArgument = argument.toLowerCase();

      if (normalizedArgument === "help" || normalizedArgument === "/?") {
         printUsage();
         return 0;
      }

      if (normalizedArgument === "nopush" || normalizedArgument === "local") {
         pushToRegistry = false;
      } else if (normalizedArgument.startsWith("skip:")) {
         const requestedPackages = normalizedArgument
            .slice("skip:".length)
            .split(/[\s,]+/)
            .filter(Boolean);

         for (const packageKey of requestedPackages) {
            if (packageKeys.has(packageKey)) skippedPackages.add(packageKey);
            else console.warn(`WARNING: Unknown package "${packageKey}" in skip list, ignoring.`);
         }
      }
   }

   console.log("========================================");
   console.log("Building Docker Images");
   console.log("========================================");

   for (const packageDefinition of packages) {
      if (skippedPackages.has(packageDefinition.key)) {
         console.log(`Skipping build: ${packageDefinition.key}`);
         continue;
      }

      console.log(`Building ${packageDefinition.key}...`);
      const exitCode = await runCommand(["docker", "build", "-t", packageDefinition.image, "-f", packageDefinition.dockerfile, "."], { cwd: repositoryRoot });

      if (exitCode !== 0) {
         printFailure();
         return 1;
      }
   }

   console.log();
   console.log("========================================");
   if (pushToRegistry) {
      console.log("Pushing Images to Registry");
      console.log("========================================");

      for (const packageDefinition of packages) {
         if (skippedPackages.has(packageDefinition.key)) {
            console.log(`Skipping push: ${packageDefinition.key}`);
            continue;
         }

         const exitCode = await runCommand(["docker", "push", `${packageDefinition.image}:latest`], { cwd: repositoryRoot });
         if (exitCode !== 0) {
            printFailure();
            return 1;
         }
      }
   } else {
      console.log("Skipping Registry Push");
      console.log("========================================");
      console.log("WARNING: Using local images only.");
      console.log("This only works on single-node swarm!");
      console.log();
   }

   console.log();
   console.log("========================================");
   console.log("Deploying Stack");
   console.log("========================================");

   console.log("Removing old stack...");
   const removeStackExitCode = await runCommand(["docker", "stack", "rm", stackName], {
      cwd: repositoryRoot,
      ignoreStderr: true,
   });
   if (removeStackExitCode === 0) {
      console.log("Waiting for stack removal...");
      await Bun.sleep(10_000);
   }

   console.log("Updating Caddy config...");
   await runCommand(["docker", "config", "rm", "caddy_config"], { cwd: repositoryRoot, ignoreStderr: true });
   const createConfigExitCode = await runCommand(["docker", "config", "create", "caddy_config", "Caddyfile"], {
      cwd: repositoryRoot,
   });
   if (createConfigExitCode !== 0) {
      printFailure();
      return 1;
   }

   console.log("Deploying new stack...");
   const deployCommand = ["docker", "stack", "deploy", "-c", "docker-stack.yaml", stackName];
   if (pushToRegistry) deployCommand.push("--with-registry-auth");

   const deployExitCode = await runCommand(deployCommand, { cwd: repositoryRoot });
   if (deployExitCode !== 0) {
      printFailure();
      return 1;
   }

   console.log();
   console.log("========================================");
   console.log("Deployment Complete!");
   console.log("========================================");
   console.log();
   console.log(`View services: docker stack services ${stackName}`);
   console.log(`View logs: docker service logs ${stackName}_[service_name] -f`);
   console.log();

   return 0;
}

process.exitCode = await deploy();
