import { type EmojiInfo, type NormalizedEmoji, getEmojiCodepoint } from "@huginn/shared";
import Bun from "bun";
import emojiData from "emojibase-data/en/compact.json" with { type: "json" };
import emojiShortcodes from "emojibase-data/en/shortcodes/emojibase.json" with { type: "json" };
import { mkdtemp, rm } from "fs/promises";
import { Octokit } from "octokit";
import { tmpdir } from "os";
import { join } from "path";

import extras from "./emoji-extras/extras.json" with { type: "json" };
import { generateEmojiSprite, type EmojiMapMeta, type EmojiPosition } from "./generate-emoji-sheet";

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

async function getNormalizedEmojis() {
   const normalizedEmojis = new Map<string, NormalizedEmoji>();

   const slugsByCodepoint = new Map<string, string[]>();
   for (const [codepoint, slugs] of Object.entries(emojiShortcodes)) {
      const slugArray = Array.isArray(slugs) ? slugs.map((s) => `:${s}:`) : [`:${slugs}:`];
      slugsByCodepoint.set(codepoint.toLowerCase(), slugArray);
   }

   for (const emoji of emojiData) {
      const codepoint = emoji.hexcode.toLowerCase();
      const group = emoji.group;

      const baseSlugs = slugsByCodepoint.get(codepoint) ?? [];
      normalizedEmojis.set(codepoint, {
         group,
         slugs: baseSlugs,
         unicode: emoji.unicode,
         codepoint,
         tone: emoji.skins ? 0 : undefined,
      });

      if (emoji.skins) {
         emoji.skins.forEach((skin, i) => {
            const skinSlugs = slugsByCodepoint.get(skin.hexcode.toLowerCase()) ?? [];
            normalizedEmojis.set(skin.hexcode.toLowerCase(), {
               group: group,
               slugs: skinSlugs,
               unicode: skin.unicode,
               codepoint: skin.hexcode.toLowerCase(),
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
      const { codepoint, slugs, group, pngPath, svgPath, emoji } = extra;
      const svgFile = await Bun.file(join(import.meta.dir, EXTRAS, svgPath)).arrayBuffer();
      const pngFile = await Bun.file(join(import.meta.dir, EXTRAS, pngPath)).arrayBuffer();
      await Bun.write(Bun.file(join(svgDir, svgPath)), svgFile);
      await Bun.write(Bun.file(join(pngDir, pngPath)), pngFile);

      normalizedEmojis.set(codepoint.toLowerCase(), { emoji, slugs, codepoint: codepoint.toLowerCase(), group });
   }

   return normalizedEmojis;
}

async function copyEmojis(data: EmojiInfo, svgDir: string, outputDir: string) {
   await rm(outputDir, { recursive: true, force: true });

   const files: Array<{ path: string; name: string }> = [];

   await Promise.allSettled(
      data.emojis.map(async (x) => {
         const srcPath = join(svgDir, x.filename);
         const destPath = join(outputDir, `${x.id}.svg`);
         const svgFile = await Bun.file(srcPath).arrayBuffer();
         await Bun.write(Bun.file(destPath), svgFile);
         files.push({ path: destPath, name: `${x.id}.svg` });
      }),
   );

   console.log(`Copied ${files.length} emojis to ${outputDir}`);

   return files;
}

function checkDuplicates(data: EmojiInfo) {
   const seen = new Set<string>();
   const duplicates: string[] = [];

   for (const emoji of data.emojis) {
      if (seen.has(emoji.id)) {
         duplicates.push(emoji.id);
      } else {
         seen.add(emoji.id);
      }
   }

   if (duplicates.length > 0) {
      console.warn(`Warning: Found ${duplicates.length} duplicate codepoints: ${duplicates.join(", ")}`);
   }
}

type EmojiInfo = {
   meta?: EmojiMapMeta;
   emojis: Array<{
      codepoint: string;
      filename: string;
      id: string;
      position?: EmojiPosition;
      slugs: string[];
      emoji?: string;
      group?: string;
      tone?: number | null;
   }>;
};
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

      const data: EmojiInfo = {
         meta: undefined,
         emojis: [],
      };

      console.log(`Normalizing emojis...`);
      const normalizedEmojis = await getNormalizedEmojis();

      const extrasResolved = await resolveExtras(svgDir, pngDir);

      const finalEmojis = new Map([...normalizedEmojis, ...extrasResolved]);

      const { webpPath, emojiMap } = await generateEmojiSprite({ input: pngDir, output: OUTPUT, padding: 1, lossless: false });
      data.meta = emojiMap.meta;

      for (const emoji of finalEmojis.values()) {
         const codepoint = emoji.codepoint;
         const normalized = finalEmojis.get(codepoint);

         if (!normalized) {
            console.warn(`Warning: Emoji with codepoint ${codepoint} not found in normalized emojis.`);
            continue;
         }

         const twemojiCodepoint = getEmojiCodepoint(normalized.unicode);
         const position = emojiMap.emojis[twemojiCodepoint];

         data.emojis.push({
            codepoint: twemojiCodepoint,
            filename: twemojiCodepoint + ".svg",
            position,
            slugs: normalized.slugs,
            unicode: normalized.unicode,
            group: normalized.group,
            tone: normalized.tone,
         });
      }

      console.log("Created emoji info with", data.emojis.length, "entries.");

      checkDuplicates(data);

      console.log(`Copying emojis to output directory...`);
      await copyEmojis(data, svgDir, join(OUTPUT, "emojis"));

      console.log("Writing emojis.json...");
      await Bun.write(join(OUTPUT, "emojis.json"), JSON.stringify(data, null, 3));

      console.log(`Done!`);
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
