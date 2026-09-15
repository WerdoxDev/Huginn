import type { Dirent } from "node:fs";

import binding from "bindings";
import { execFile, spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { readFile, readdir, readlink } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, join } from "node:path";
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
   class?: string;
   initialClass?: string;
};

const IMAGE_MIME_TYPES: Record<string, string> = {
   ".ico": "image/x-icon",
   ".jpeg": "image/jpeg",
   ".jpg": "image/jpeg",
   ".png": "image/png",
   ".svg": "image/svg+xml",
   ".webp": "image/webp",
   ".xpm": "image/x-xpixmap",
};

const userDataHome = process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
const systemDataHomes = (process.env.XDG_DATA_DIRS || "/usr/local/share:/usr/share").split(":").filter(Boolean);
const dataHomes = [
   userDataHome,
   join(homedir(), ".local", "share", "flatpak", "exports", "share"),
   ...systemDataHomes,
   "/var/lib/flatpak/exports/share",
   "/var/lib/snapd/desktop",
].filter((path, index, paths) => paths.indexOf(path) === index);

let linuxProcessIdentifiers = new Map<number, string[]>();
let desktopIconIndexPromise: Promise<Map<string, string>> | undefined;
let iconPathIndexPromise: Promise<Map<string, string>> | undefined;
const iconDataUrlPromises = new Map<string, Promise<string | null>>();

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

function normalizeApplicationIdentifier(value?: string): string | undefined {
   if (!value) return undefined;

   const normalized = basename(value.replace(/ \(deleted\)$/, ""))
      .replace(/\.desktop$/i, "")
      .trim()
      .toLowerCase();
   return normalized || undefined;
}

async function readDirectory(path: string): Promise<Dirent[]> {
   try {
      return await readdir(path, { withFileTypes: true });
   } catch {
      return [];
   }
}

async function findFiles(path: string, predicate: (entry: Dirent) => boolean, depth: number): Promise<string[]> {
   const entries = (await readDirectory(path)).sort((a, b) => a.name.localeCompare(b.name));
   const files = entries.filter(predicate).map((entry) => join(path, entry.name));
   if (depth === 0) return files;

   const nestedFiles = await Promise.all(
      entries.filter((entry) => entry.isDirectory()).map((entry) => findFiles(join(path, entry.name), predicate, depth - 1)),
   );
   return files.concat(...nestedFiles);
}

function parseDesktopEntry(contents: string): Map<string, string> {
   const values = new Map<string, string>();
   let inDesktopEntry = false;

   for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
         inDesktopEntry = trimmed === "[Desktop Entry]";
         continue;
      }
      if (!inDesktopEntry || !trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator);
      if (!key.includes("[")) values.set(key, trimmed.slice(separator + 1).trim());
   }

   return values;
}

function getExecutableFromDesktopEntry(command?: string): string | undefined {
   if (!command) return undefined;

   const tokens = command.match(/"(?:\\.|[^"])*"|'[^']*'|[^\s]+/g)?.map((token) => token.replace(/^(['"])(.*)\1$/, "$2"));
   if (!tokens?.length) return undefined;

   let index = normalizeApplicationIdentifier(tokens[0]) === "env" ? 1 : 0;
   while (tokens[index]?.startsWith("-") || /^[A-Za-z_][A-Za-z0-9_]*=/.test(tokens[index] ?? "")) index++;
   return tokens[index];
}

async function createDesktopIconIndex(): Promise<Map<string, string>> {
   const index = new Map<string, string>();
   const seenDesktopIds = new Set<string>();

   for (const dataHome of dataHomes) {
      const desktopFiles = await findFiles(
         join(dataHome, "applications"),
         (entry) => (entry.isFile() || entry.isSymbolicLink()) && entry.name.endsWith(".desktop"),
         2,
      );
      const entries = await Promise.all(
         desktopFiles.map(async (path) => {
            try {
               return { path, values: parseDesktopEntry(await readFile(path, "utf8")) };
            } catch {
               return undefined;
            }
         }),
      );

      for (const entry of entries) {
         if (!entry) continue;

         const desktopId = normalizeApplicationIdentifier(entry.path);
         if (!desktopId || seenDesktopIds.has(desktopId)) continue;
         seenDesktopIds.add(desktopId);

         const values = entry.values;
         const icon = values.get("Icon");
         if (!icon || values.get("Hidden") === "true" || (values.get("Type") && values.get("Type") !== "Application")) continue;

         const identifiers = [
            desktopId,
            values.get("StartupWMClass"),
            values.get("X-GNOME-WMClass"),
            values.get("X-Flatpak"),
            values.get("X-SnapInstanceName"),
            getExecutableFromDesktopEntry(values.get("Exec")),
            getExecutableFromDesktopEntry(values.get("TryExec")),
         ];
         for (const identifier of identifiers) {
            const normalized = normalizeApplicationIdentifier(identifier);
            if (normalized && !index.has(normalized)) index.set(normalized, icon);
         }
      }
   }

   return index;
}

function getIconFileScore(path: string): number {
   const normalized = path.toLowerCase();
   const size = normalized.match(/\/(\d+)x(\d+)\//);
   return (
      (normalized.includes("/hicolor/") ? 1_000_000 : 0) +
      (normalized.includes("/scalable/") ? 100_000 : 0) +
      (size ? Math.min(Number(size[1]), Number(size[2])) : 0)
   );
}

async function createIconPathIndex(): Promise<Map<string, string>> {
   const index = new Map<string, string>();
   const iconRoots = [join(homedir(), ".icons"), ...dataHomes.map((path) => join(path, "icons")), ...dataHomes.map((path) => join(path, "pixmaps"))].filter(
      (path, pathIndex, paths) => paths.indexOf(path) === pathIndex,
   );

   for (const iconRoot of iconRoots) {
      const iconFiles = await findFiles(
         iconRoot,
         (entry) => (entry.isFile() || entry.isSymbolicLink()) && extname(entry.name).toLowerCase() in IMAGE_MIME_TYPES,
         4,
      );
      iconFiles.sort((a, b) => getIconFileScore(b) - getIconFileScore(a));

      for (const path of iconFiles) {
         const filename = basename(path).toLowerCase();
         const name = filename.slice(0, -extname(filename).length);
         if (!index.has(filename)) index.set(filename, path);
         if (!index.has(name)) index.set(name, path);
      }
   }

   return index;
}

async function readIconDataUrl(icon: string): Promise<string | null> {
   const cached = iconDataUrlPromises.get(icon);
   if (cached) return cached;

   const promise = (async () => {
      const path = icon.startsWith("/") ? icon : (iconPathIndexPromise ??= createIconPathIndex()).then((index) => index.get(icon.toLowerCase()));
      const resolvedPath = typeof path === "string" ? path : await path;
      if (!resolvedPath) return null;

      const mimeType = IMAGE_MIME_TYPES[extname(resolvedPath).toLowerCase()];
      if (!mimeType) return null;

      try {
         const image = await readFile(resolvedPath);
         return `data:${mimeType};base64,${image.toString("base64")}`;
      } catch {
         return null;
      }
   })();
   iconDataUrlPromises.set(icon, promise);
   return promise;
}

async function getProcessIconBase64(processId: number): Promise<string | null> {
   if (process.platform !== "linux") return addon.getProcessIconBase64(processId);
   if (!Number.isSafeInteger(processId) || processId <= 0) return null;

   const identifiers = new Set(linuxProcessIdentifiers.get(processId) ?? []);
   const exePath = await readlink(`/proc/${processId}/exe`).catch(() => undefined);
   const exeIdentifier = normalizeApplicationIdentifier(exePath);
   if (exeIdentifier) identifiers.add(exeIdentifier);

   const desktopIconIndex = await (desktopIconIndexPromise ??= createDesktopIconIndex());
   for (const identifier of identifiers) {
      const icon = desktopIconIndex.get(identifier);
      if (icon) return readIconDataUrl(icon);
   }

   for (const identifier of identifiers) {
      const icon = await readIconDataUrl(identifier);
      if (icon) return icon;
   }
   return null;
}

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
      const processIdentifiers = new Map<number, string[]>();
      const applications = await Promise.all(
         json.map(async (x) => {
            const exePath = await readlink(`/proc/${x.pid}/exe`).catch(() => undefined);
            const cmdLine = await execFileAsync("ps", ["-p", x.pid.toString(), "-o", "command="])
               .then((result) => result.stdout.trim())
               .catch(() => undefined);
            const identifiers = [x.class, x.initialClass, exePath]
               .map(normalizeApplicationIdentifier)
               .filter((identifier): identifier is string => Boolean(identifier));
            processIdentifiers.set(x.pid, [...new Set([...(processIdentifiers.get(x.pid) ?? []), ...identifiers])]);
            return {
               processId: x.pid,
               windowTitle: x.title,
               cmdLine,
               exePath,
               hwnd: undefined,
               stableId: x.stableId,
               rect: { x: x.at[0], y: x.at[1], width: x.size[0], height: x.size[1] },
            };
         }),
      );
      linuxProcessIdentifiers = processIdentifiers;
      return applications;
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
   getProcessIconBase64,
   startDesktopCaptureLINUX,
   stopDesktopCaptureLINUX,
   resumeDesktopCaptureLINUX,
   getOpenApplications,
   getScreenThumbnailBase64,
   getWindowThumbnailBase64WIN: addon.getWindowThumbnailBase64,
   getWindowThumbnailBase64LINUX,
   getAllDisplaysLINUX,
};
