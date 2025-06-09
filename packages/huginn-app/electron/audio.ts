import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";
import path from "node:path";
import { type BrowserWindow, app } from "electron";
import { _dirname } from "./main";

export async function getProcessIds() {
   const executable = app.isPackaged ? path.join(process.resourcesPath, "cpp", "executables", "ProcessList.exe") : "../../cpp/executables/ProcessList.exe";

   const cppProcess = spawn(`${path.resolve(__dirname, executable)}`, { detached: true, stdio: "pipe" });
   cppProcess.stdout.setEncoding("utf8");

   return new Promise<Array<{ processId: string, title: string }>>((r) => {
      const processes: Array<{ processId: string, title: string }> = []; processes
      cppProcess.stdout.on("data", (d: string) => {
         processes.push(...d.split("\n").map(x => {
            const [processId, title] = x.replace("\r", "").split(";");
            return { processId, title };
         }))
      })
      cppProcess.stdout.on("close", () => {
         r(processes)
      })
   });
}

let cppProcess: ChildProcessWithoutNullStreams;

export function startAudioCapture(processId: string, window: BrowserWindow) {
   const executable = app.isPackaged ? path.join(process.resourcesPath, "cpp", "executables", "ApplicationLoopback.exe") : "../../cpp/executables/ApplicationLoopback.exe";

   cppProcess = spawn(`${path.resolve(__dirname, executable)}`, [processId], { detached: true, stdio: "pipe" });

   cppProcess.stdout.on("data", (d) => {
      window.webContents.send("audio:loopback-data", d)
   })
}

export function stopAudioCapture() {
   cppProcess?.kill()
}
