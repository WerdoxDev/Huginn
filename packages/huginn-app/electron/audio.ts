import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path from "node:path";
import type { BrowserWindow } from "electron";

export async function getProcessIds() {
   const executable = "../../cpp/executables/ProcessList.exe";

   const process = spawn(`${path.resolve(__dirname, executable)}`, { detached: true, stdio: "pipe" });
   process.stdout.setEncoding("utf8");

   return new Promise<Array<{ processId: string, title: string }>>((r) => {
      const processes: Array<{ processId: string, title: string }> = []; processes
      process.stdout.on("data", (d: string) => {
         processes.push(...d.split("\n").map(x => {
            const [processId, title] = x.replace("\r", "").split(";");
            return { processId, title };
         }))
      })
      process.stdout.on("close", () => {
         r(processes)
      })
   });
}

let process: ChildProcessWithoutNullStreams;

export function startAudioCapture(processId: string, window: BrowserWindow) {
   const executable = "../../cpp/executables/ApplicationLoopback.exe";

   process = spawn(`${path.resolve(__dirname, executable)}`, [processId], { detached: true, stdio: "pipe" });

   process.stdout.on("data", (d) => {
      window.webContents.send("audio:loopback-data", d)
   })
}

export function stopAudioCapture() {
   process?.kill()
}
