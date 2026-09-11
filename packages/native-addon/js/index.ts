import binding from "bindings";
import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { promisify } from "node:util";

const MAX_BUFFER_SIZE = 32 * 1024 * 1024; // 32 MB

const execFileAsync = promisify(execFile);

export type ProcessInfo = {
   processId: number;
   windowTitle: string;
   cmdLine?: string;
   exePath?: string;
   hwnd?: number;
   stableId?: string;
   rect?: { x: number; y: number; width: number; height: number } | null;
};

type HyprlandClient = {
   pid: number;
   title: string;
   at: [number, number];
   size: [number, number];
   stableId: string;
};

export type Addon = {
   getFileSha256(filepath: string): string;
   getProcessIconBase64(processId: number): Promise<string | null>;
   getOpenApplications(): Promise<ProcessInfo[]>;
   getPackageDisplayName(processId: number): string | null;
   getWindowThumbnailBase64(hwnd: number, thumbW: number, thumbH: number): Promise<string | null>;
   getScreenThumbnailBase64(x: number, y: number, width: number, height: number): Promise<string | null>;
};

const addon: Addon = binding({
   try: [
      ["module_root", "build", "Release", "huginn_addon.node"],
      ["native-addon", "build", "Release", "huginn_addon.node"],
   ],
});

async function getScreenThumbnailBase64(x: number, y: number, width: number, height: number): Promise<string | null> {
   if (process.platform === "linux") {
      const { stdout } = await execFileAsync("grim", ["-g", `${x},${y} ${width}x${height}`, "-t", "png", "-"], {
         maxBuffer: MAX_BUFFER_SIZE,
         encoding: "buffer",
      });
      return "data:image/png;base64," + stdout.toString("base64");
   } else {
      return await addon.getScreenThumbnailBase64(x, y, width, height);
   }
}

// async function getWindowThumbnailBase64(hwnd: number, thumbW: number, thumbH: number): Promise<string | null> {
//    if (process.platform === "linux") {
//       const { stdout } = await execFileAsync("grim", ["-g", `x11:${hwnd}`, "-t", "png", "-"]);
//       return Buffer.from(stdout).toString("base64");
//    } else {
//       return await addon.getWindowThumbnailBase64(hwnd, thumbW, thumbH);
//    }
// }

async function getOpenApplications(): Promise<ProcessInfo[]> {
   if (process.platform === "linux") {
      const { stdout } = await execFileAsync("hyprctl", ["-j", "clients"]);
      const json = JSON.parse(stdout) as HyprlandClient[];
      return json.map((x) => ({
         processId: x.pid,
         windowTitle: x.title,
         cmdLine: undefined,
         exePath: undefined,
         hwnd: undefined,
         stableId: x.stableId,
         rect: { x: x.at[0], y: x.at[1], width: x.size[0], height: x.size[1] },
      }));
   } else {
      return addon.getOpenApplications();
   }
}

// async function getRegionThumbnailBase64(x: number, y: number, width: number, height: number): Promise<string | null> {
//    if (process.platform === "linux") {
//       const { stdout } = await execFileAsync("grim", ["-g", `${x},${y} ${width}x${height}`, "-t", "png", "-"]);
//       return Buffer.from(stdout).toString("base64");
//    } else {
//       throw new Error("getRegionThumbnailBase64 is not implemented for this platform");
//    }
// }

async function getWindowThumbnailBase64LINUX(stableId: string, scale: number): Promise<string | null> {
   const { stdout } = await execFileAsync("grim", ["-T", stableId, "-t", "png", "-s", scale.toString(), "-"], {
      maxBuffer: MAX_BUFFER_SIZE,
      encoding: "buffer",
   });
   const base64 = "data:image/png;base64," + stdout.toString("base64");
   return base64;
}

async function getAllDisplaysLINUX() {
   const { stdout } = await execFileAsync("hyprctl", ["-j", "monitors"]);
   const json = JSON.parse(stdout) as { name: string; id: number; width: number; height: number; scale: number; x: number; y: number }[];
   return json.map((x) => ({
      id: x.id,
      name: x.name,
      x: x.x,
      y: x.y,
      width: x.width,
      height: x.height,
      scaleFactor: x.scale,
   }));
}

type CaptureProcess = {
   recorder: ChildProcessWithoutNullStreams;
   stopping: boolean;
};

let captureProcess: CaptureProcess | null = null;

function stopDesktopCaptureLINUX() {
   const capture = captureProcess;
   if (!capture) return;

   captureProcess = null;
   capture.stopping = true;

   if (capture.recorder.exitCode === null && capture.recorder.signalCode === null) capture.recorder.kill("SIGINT");
}

function resumeDesktopCaptureLINUX() {
   captureProcess?.recorder.stdout.resume();
}

function startDesktopCaptureLINUX(options: {
   monitor?: string;
   rect?: { x: number; y: number; width: number; height: number };
   width: number;
   height: number;
   frameRate: number;
   callback: (chunk: Buffer) => void;
   errorCallback: (error: Error) => void;
}) {
   stopDesktopCaptureLINUX();

   console.log(`Starting capture on monitor ${options.monitor} with resolution ${options.width}x${options.height} at ${options.frameRate} FPS`);
   const recorder = spawn("wf-recorder", [
      "-y",
      ...(options.monitor ? ["-o", options.monitor] : []),
      ...(options.rect ? ["-g", `${options.rect.x},${options.rect.y} ${options.rect.width}x${options.rect.height}`] : []),
      "-m",
      "mpegts",
      "-c",
      "h264_vaapi",
      "-F",
      `scale_vaapi=w=${options.width}:h=${options.height}:format=nv12:out_range=full:mode=fast`,
      "-p",
      "profile=high",
      // "-p",
      // "level=51",
      "-p",
      `g=${options.frameRate}`,
      "-p",
      "bf=0",
      "-p",
      "rc_mode=CQP",
      "-p",
      "qp=20",
      "-r",
      String(options.frameRate),
      "-f",
      "pipe:1",
   ]);
   const capture: CaptureProcess = { recorder, stopping: false };
   captureProcess = capture;

   const fail = (error: Error) => {
      if (captureProcess !== capture || capture.stopping) return;
      options.errorCallback(error);
      stopDesktopCaptureLINUX();
   };

   recorder.stderr.on("data", (data) => process.stderr.write(`[wf-recorder] ${data}`));
   recorder.on("error", fail);
   recorder.stdout.on("error", fail);
   recorder.on("exit", (code, signal) => {
      if (captureProcess === capture && !capture.stopping) fail(new Error(`wf-recorder exited unexpectedly (${signal ?? code})`));
   });

   recorder.stdout.on("data", (chunk: Buffer) => {
      if (captureProcess !== capture) return;

      recorder.stdout.pause();
      try {
         options.callback(chunk);
      } catch (error) {
         fail(error instanceof Error ? error : new Error(String(error)));
      }
   });
}

export default {
   ...addon,
   startDesktopCaptureLINUX,
   stopDesktopCaptureLINUX,
   resumeDesktopCaptureLINUX,
   getOpenApplications,
   getScreenThumbnailBase64,
   getWindowThumbnailBase64WIN: addon.getWindowThumbnailBase64,
   getWindowThumbnailBase64LINUX,
   getAllDisplaysLINUX,
};
