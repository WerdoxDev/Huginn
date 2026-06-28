import { type EmojiInfo, type NormalizedEmoji, getEmojiCodepoint } from "@huginn/shared";
import { S3Client } from "bun";
import emojiData from "emojibase-data/en/compact.json" with { type: "json" };
import emojiShortcodes from "emojibase-data/en/shortcodes/emojibase.json" with { type: "json" };
import { mkdtemp, rm } from "fs/promises";
import { Octokit } from "octokit";
import { tmpdir } from "os";
import { join } from "path";
import { parseArgs } from "util";

import extras from "./emoji-extras/extras.json" with { type: "json" };
import { generateEmojiSprite } from "./generate-emoji-sheet";

const { values } = parseArgs({
   args: Bun.argv,
   options: {
      upload: {
         type: "boolean",
         short: "u",
         default: false,
      },
   },
   allowPositionals: true,
});

const PREFIX = "twemoji/";
const TOKEN = process.env.GITHUB_TOKEN;
const CONCURRENCY = 5;
const OWNER = "jdecked";
const REPO = "twemoji";
const SVG_PATH = "assets/svg";
const PNG_PATH = "assets/72x72";
const REF = "main";
const OUTPUT = "./emoji-out";
const EXTRAS = "./emoji-extras";

const s3 = new S3Client({
   region: process.env.AWS_REGION,
   accessKeyId: process.env.AWS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_KEY,
   bucket: process.env.AWS_BUCKET,
});

const octokit = new Octokit({ auth: TOKEN });

/** Download the repo as a .tar.gz into a temp dir and return the path. */
async function downloadRepo(destDir: string): Promise<string> {
   console.log("Fetching tarball URL from GitHub...");

   // octokit gives us a redirect URL for the tarball
   const response = await octokit.rest.repos.downloadTarballArchive({
      owner: OWNER,
      repo: REPO,
      ref: REF,
      request: { redirect: "manual" },
   });

   // The redirect location is the actual CDN URL (no API rate-limit cost)
   const tarUrl: string = (response as any).headers?.location ?? (response as any).url;

   if (!tarUrl) throw new Error("Could not resolve tarball download URL.");

   console.log(`Downloading tarball...`);
   const res = await fetch(tarUrl, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
   });
   if (!res.ok) throw new Error(`Tarball download failed: ${res.status} ${res.statusText}`);

   const tarPath = join(destDir, "twemoji.tar.gz");
   await Bun.write(tarPath, res);
   console.log(`Tarball saved to ${tarPath}`);
   return tarPath;
}

/** Extract the tarball and return the path to the SVG directory. */
async function extractRepo(tarPath: string, destDir: string): Promise<string> {
   console.log("Extracting...");
   const proc = Bun.spawn(["tar", "xzf", tarPath, "-C", destDir], {
      stdout: "inherit",
      stderr: "inherit",
   });
   const code = await proc.exited;
   if (code !== 0) throw new Error(`tar exited with code ${code}`);

   // GitHub tarballs extract into a single top-level folder like "twitter-twemoji-<sha>/"
   const glob = new Bun.Glob("*/");
   const [topLevel] = await Array.fromAsync(glob.scan({ cwd: destDir, onlyFiles: false }));
   if (!topLevel) throw new Error("Could not find extracted directory.");

   // const svgDir = join(destDir, topLevel, SVG_PATH);
   console.log(`Extracted. Top-level dir: ${topLevel}`);
   return join(destDir, topLevel);
}

/** Retry an async operation with exponential backoff. */
async function withRetry<T>(fn: () => Promise<T>, { retries = 4, baseDelayMs = 500, label = "" } = {}): Promise<T> {
   let attempt = 0;
   while (true) {
      try {
         return await fn();
      } catch (err) {
         attempt++;
         if (attempt > retries) throw err;
         const delay = baseDelayMs * 2 ** (attempt - 1); // 500 1000 2000 4000 ms
         console.error(`${label} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms — ${(err as Error).message}`);
         await Bun.sleep(delay);
      }
   }
}

/** Upload one SVG file to S3. */
async function uploadFile(filePath: string, name: string): Promise<void> {
   await withRetry(
      async () => {
         const body = await Bun.file(filePath).arrayBuffer();
         await s3.write(`${PREFIX}${name}`, body, { type: "image/svg+xml" });
      },
      { label: name },
   );
}

/** Run tasks with bounded concurrency. */
async function pool<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<void> {
   let i = 0;
   async function worker() {
      while (i < tasks.length) {
         const idx = i++;
         await tasks[idx]();
      }
   }
   await Promise.all(Array.from({ length: concurrency }, worker));
}

function getNormalizedEmojis() {
   const normalizedEmojis = new Map<string, NormalizedEmoji>();

   const slugsByCodepoint = new Map<string, string[]>();
   for (const [codepoint, slugs] of Object.entries(emojiShortcodes)) {
      const unicode = emojiData.find((x) => x.hexcode === codepoint)?.unicode;
      if (!unicode) continue;
      const slugArray = Array.isArray(slugs) ? slugs.map((s) => `:${s}:`) : [`:${slugs}:`];
      const actualCodepoint = getEmojiCodepoint(unicode);
      slugsByCodepoint.set(actualCodepoint, slugArray);
   }

   for (const compactEmoji of emojiData) {
      const codepoint = getEmojiCodepoint(compactEmoji.unicode);
      const group = compactEmoji.group;

      const baseSlugs = slugsByCodepoint.get(codepoint) ?? [];
      normalizedEmojis.set(codepoint, {
         group: group,
         slugs: baseSlugs,
         unicode: compactEmoji.unicode,
         codepoint,
         tone: compactEmoji.skins ? 0 : undefined,
      });

      if (compactEmoji.skins) {
         compactEmoji.skins.forEach((skin, i) => {
            const codepoint = getEmojiCodepoint(skin.unicode);
            const skinSlugs = slugsByCodepoint.get(codepoint) ?? [];
            normalizedEmojis.set(codepoint, {
               group: group,
               slugs: skinSlugs,
               unicode: skin.unicode,
               codepoint,
               tone: i + 1,
            });
         });
      }
   }

   return normalizedEmojis;
}

async function resolveExtras(svgDir: string, pngDir: string) {
   const normalizedEmojis = new Map<string, NormalizedEmoji>();
   for (const extra of extras) {
      const { codepoint, slugs, group, pngPath, svgPath, unicode } = extra;
      const svgFile = await Bun.file(join(import.meta.dir, EXTRAS, svgPath)).arrayBuffer();
      const pngFile = await Bun.file(join(import.meta.dir, EXTRAS, pngPath)).arrayBuffer();
      await Bun.write(Bun.file(join(svgDir, svgPath)), svgFile);
      await Bun.write(Bun.file(join(pngDir, pngPath)), pngFile);

      normalizedEmojis.set(codepoint.toLowerCase(), { unicode, slugs, codepoint: codepoint.toLowerCase(), group });
   }

   return normalizedEmojis;
}

async function copyEmojis(data: EmojiInfo, svgDir: string, outputDir: string) {
   await rm(outputDir, { recursive: true, force: true });

   const files: Array<{ path: string; name: string }> = [];

   const result = await Promise.allSettled(
      data.emojis.map(async (x) => {
         const srcPath = join(svgDir, x.filename);
         const destPath = join(outputDir, `${x.codepoint}.svg`);
         const svgFile = await Bun.file(srcPath).arrayBuffer();
         await Bun.write(Bun.file(destPath), svgFile);
         files.push({ path: destPath, name: `${x.codepoint}.svg` });
      }),
   );

   result.filter((r) => r.status === "rejected").forEach((r) => console.error(r.reason));

   return files;
}

function checkDuplicates(data: EmojiInfo) {
   const seen = new Set<string>();
   const duplicates: string[] = [];

   for (const emoji of data.emojis) {
      if (seen.has(emoji.codepoint)) {
         duplicates.push(emoji.codepoint);
      } else {
         seen.add(emoji.codepoint);
      }
   }

   if (duplicates.length > 0) {
      console.warn(`Warning: Found ${duplicates.length} duplicate codepoints: ${duplicates.join(", ")}`);
   }
}

async function main() {
   const tmpDir = await mkdtemp(join(tmpdir(), "twemoji-"));
   console.log(`Working in ${tmpDir}\n`);

   try {
      const tarPath = await downloadRepo(tmpDir);
      const topLevelDir = await extractRepo(tarPath, tmpDir);
      const svgDir = join(topLevelDir, SVG_PATH);
      const pngDir = join(topLevelDir, PNG_PATH);

      // Collect all SVG files
      const glob = new Bun.Glob("*.svg");
      const svgFiles = await Array.fromAsync(glob.scan({ cwd: svgDir, absolute: false }));
      console.log(`Found ${svgFiles.length} SVG files.`);
      console.log(`Found ${svgFiles.length} PNG files.`);

      let done = 0;
      let failed = 0;

      const data: EmojiInfo = {
         meta: undefined,
         emojis: [],
      };

      console.log(`Normalizing emojis...`);
      const normalizedEmojis = getNormalizedEmojis();
      const extrasResolved = await resolveExtras(svgDir, pngDir);

      const finalEmojis = new Map([...normalizedEmojis, ...extrasResolved]);
      const { webpPath, emojiMap } = await generateEmojiSprite({ input: pngDir, output: OUTPUT, padding: 1, lossless: false });
      data.meta = emojiMap.meta;

      for (const emoji of finalEmojis.values()) {
         const codepoint = emoji.codepoint;
         const position = emojiMap.emojis[codepoint];
         const normalized = finalEmojis.get(codepoint);

         data.emojis.push({
            codepoint,
            filename: emoji.codepoint.toLowerCase() + ".svg",
            position,
            slugs: normalized?.slugs ?? [],
            unicode: normalized?.unicode,
            group: normalized?.group,
            tone: normalized?.tone ?? undefined,
         });
      }

      console.log("Created emoji info with", data.emojis.length, "entries.");

      checkDuplicates(data);

      console.log(`Copying emojis to output directory...`);
      const copiedFiles = await copyEmojis(data, svgDir, join(OUTPUT, "emojis"));

      if (values.upload) {
         const tasks = copiedFiles.map((file) => async () => {
            try {
               await uploadFile(file.path, file.name);
               done++;
               if (done % 50 === 0 || done === svgFiles.length) {
                  console.log(`${done}/${svgFiles.length} uploaded...`);
               }
            } catch (err) {
               failed++;
               console.error(`${file.name}: ${(err as Error).message}`);
            }
         });

         await pool(tasks, CONCURRENCY);
      } else {
         console.log("Upload skipped (use --upload to enable).");
      }

      console.log("Writing emojis.json...");
      await Bun.write(join(OUTPUT, "emojis.json"), JSON.stringify(data, null, 3));

      console.log(`Done!  ${done} uploaded, ${failed} failed.`);
      console.log(`Bucket prefix: ${process.env.AWS_BUCKET}/${PREFIX}`);
   } finally {
      console.log(`Cleaning up ${tmpDir}...`);
      // await rm(tmpDir, { recursive: true, force: true });
      console.log("Cleaned up.");
   }
}

main().catch((err) => {
   console.error("Fatal:", err);
   process.exit(1);
});
