#!/usr/bin/env bun

import { readdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";

const startDirectory = resolve(process.cwd());

console.log('This will delete all "node_modules" folders from the current directory and subdirectories.');
const confirmation = prompt("Are you sure? (y/n): ");

if (confirmation?.trim().toLowerCase() !== "y") {
   console.log("Operation canceled.");
} else {
   const pendingDirectories = [startDirectory];

   while (pendingDirectories.length > 0) {
      const directory = pendingDirectories.pop();
      if (!directory) continue;

      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
         const entryPath = join(directory, entry.name);

         if (entry.name === "node_modules" && (entry.isDirectory() || entry.isSymbolicLink())) {
            console.log(`Deleting folder: ${entryPath}`);
            await rm(entryPath, { recursive: true, force: true });
         } else if (entry.isDirectory()) {
            pendingDirectories.push(entryPath);
         }
      }
   }

   console.log('All "node_modules" folders have been deleted.');
}
