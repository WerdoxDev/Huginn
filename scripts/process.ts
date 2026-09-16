import { resolve } from "node:path";

export const repositoryRoot = resolve(import.meta.dir, "..");

type RunCommandOptions = {
   cwd?: string;
   ignoreStderr?: boolean;
};

export async function runCommand(command: string[], options: RunCommandOptions = {}): Promise<number> {
   try {
      const process = Bun.spawn(command, {
         cwd: options.cwd,
         stdin: "inherit",
         stdout: "inherit",
         stderr: options.ignoreStderr ? "ignore" : "inherit",
      });

      return await process.exited;
   } catch (error) {
      if (!options.ignoreStderr) {
         const message = error instanceof Error ? error.message : String(error);
         console.error(`Failed to run ${command[0]}: ${message}`);
      }

      return 1;
   }
}
