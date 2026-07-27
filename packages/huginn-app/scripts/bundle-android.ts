import Bun from "bun";
import * as fflate from "fflate";
import * as crypto from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { version } from "../package.json";

const WEB_BUILD_DIR = "dist";
const OUT_ZIP = `android-releases/Huginn-android-${version}.zip`;
const OUT_MANIFEST = `android-releases/manifest.json`;

const PRIVATE_KEY = process.env.CAPAWESOME_PRIVATE_KEY?.replace(/\\n/g, "\n");

async function getFilesRecursively(dir: string, baseDir = dir): Promise<Record<string, Uint8Array>> {
   const entries = await fs.readdir(dir, { withFileTypes: true });
   const files: Record<string, Uint8Array> = {};

   for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
         const nested = await getFilesRecursively(fullPath, baseDir);
         Object.assign(files, nested);
      } else if (entry.isFile()) {
         const relPath = path.relative(baseDir, fullPath);
         const data = await Bun.file(fullPath).arrayBuffer();
         files[relPath] = new Uint8Array(data);
      }
   }

   return files;
}

async function zipDirectory(sourceDir: string, outPath: string) {
   await fs.mkdir("android-releases", { recursive: true });

   const files = await getFilesRecursively(sourceDir);
   const zipData = fflate.zipSync(files, { level: 9 });
   await Bun.write(outPath, zipData);
}

async function computeChecksum(filePath: string) {
   const data = Buffer.from(await Bun.file(filePath).arrayBuffer());
   return crypto.createHash("sha256").update(data).digest("hex");
}

async function signBundle(filePath: string) {
   const data = Buffer.from(await Bun.file(filePath).arrayBuffer());
   const sign = crypto.createSign("SHA256");
   sign.update(data);
   sign.end();
   return sign.sign(PRIVATE_KEY!, "base64");
}

async function main() {
   await zipDirectory(WEB_BUILD_DIR, OUT_ZIP);

   const checksum = await computeChecksum(OUT_ZIP);
   const signature = await signBundle(OUT_ZIP);

   const manifest = {
      filename: path.basename(OUT_ZIP),
      version: version,
      checksum: checksum,
      signature: signature,
   };

   await Bun.write(OUT_MANIFEST, JSON.stringify(manifest, null, 2));
}

await main();
