import type { Dirent } from "node:fs";
import { readFile, readdir, readlink } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, join } from "node:path";

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

export function updateLinuxProcessIdentifiers(
   clients: readonly { pid: number; class?: string; initialClass?: string }[],
   applications: readonly { processId: number; exePath?: string }[],
): void {
   const exePaths = new Map(applications.map((application) => [application.processId, application.exePath]));
   const processIdentifiers = new Map<number, string[]>();
   for (const client of clients) {
      const identifiers = [client.class, client.initialClass, exePaths.get(client.pid)]
         .map(normalizeApplicationIdentifier)
         .filter((identifier): identifier is string => Boolean(identifier));
      processIdentifiers.set(client.pid, [...new Set([...(processIdentifiers.get(client.pid) ?? []), ...identifiers])]);
   }
   linuxProcessIdentifiers = processIdentifiers;
}

export async function getLinuxProcessIconBase64(processId: number): Promise<string | null> {
   if (!Number.isSafeInteger(processId) || processId <= 0) return null;

   const identifiers = new Set(linuxProcessIdentifiers.get(processId) ?? []);
   const exePath = await readlink(`/proc/${processId}/exe`).catch(() => undefined);
   const exeIdentifier = normalizeApplicationIdentifier(exePath);
   if (exeIdentifier) identifiers.add(exeIdentifier);

   // Flatpak apps can launch child processes whose window class and executable differ from the desktop entry.
   const environ = await readFile(`/proc/${processId}/environ`).catch(() => undefined);
   const flatpakId = environ
      ?.toString("utf8")
      .split("\0")
      .find((entry) => entry.startsWith("FLATPAK_ID="))
      ?.slice("FLATPAK_ID=".length);
   const flatpakIdentifier = normalizeApplicationIdentifier(flatpakId);
   if (flatpakIdentifier) identifiers.add(flatpakIdentifier);

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

