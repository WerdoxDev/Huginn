import { S3Client } from "bun";
import { mkdtemp, rm } from "fs/promises";
import { Octokit } from "octokit";
import { tmpdir } from "os";
import { join } from "path";

const PREFIX = "twemoji/";
const TOKEN = process.env.GITHUB_TOKEN;
const CONCURRENCY = 20;
const OWNER = "twitter";
const REPO = "twemoji";
const SVG_PATH = "assets/svg";
const REF = "master";

const s3 = new S3Client({
   region: process.env.AWS_REGION,
   accessKeyId: process.env.AWS_KEY_ID,
   secretAccessKey: process.env.AWS_SECRET_KEY,
   bucket: process.env.AWS_BUCKET,
});

const octokit = new Octokit({ auth: TOKEN });

/** Download the repo as a .tar.gz into a temp dir and return the path. */
async function downloadRepo(destDir: string): Promise<string> {
   console.log("📥  Fetching tarball URL from GitHub …");

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

   console.log(`⬇️   Downloading tarball …`);
   const res = await fetch(tarUrl, {
      headers: TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {},
   });
   if (!res.ok) throw new Error(`Tarball download failed: ${res.status} ${res.statusText}`);

   const tarPath = join(destDir, "twemoji.tar.gz");
   await Bun.write(tarPath, res);
   console.log(`✅  Tarball saved to ${tarPath}`);
   return tarPath;
}

/** Extract the tarball and return the path to the SVG directory. */
async function extractRepo(tarPath: string, destDir: string): Promise<string> {
   console.log("📦  Extracting …");
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

   const svgDir = join(destDir, topLevel, SVG_PATH);
   console.log(`✅  Extracted. SVG dir: ${svgDir}\n`);
   return svgDir;
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
         console.error(`\n⚠️   ${label} failed (attempt ${attempt}/${retries}), retrying in ${delay}ms — ${(err as Error).message}`);
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

async function main() {
   const tmpDir = await mkdtemp(join(tmpdir(), "twemoji-"));
   console.log(`🗂️   Working in ${tmpDir}\n`);

   try {
      const tarPath = await downloadRepo(tmpDir);
      const svgDir = await extractRepo(tarPath, tmpDir);

      // Collect all SVG files
      const glob = new Bun.Glob("*.svg");
      const svgFiles = await Array.fromAsync(glob.scan({ cwd: svgDir, absolute: false }));
      console.log(`📋  Found ${svgFiles.length} SVG files. Uploading …\n`);

      let done = 0;
      let failed = 0;

      const tasks = svgFiles.map((name) => async () => {
         try {
            await uploadFile(join(svgDir, name), name);
            done++;
            if (done % 50 === 0 || done === svgFiles.length) {
               process.stdout.write(`\r⬆️   ${done}/${svgFiles.length} uploaded …`);
            }
         } catch (err) {
            failed++;
            console.error(`\n❌  ${name}: ${(err as Error).message}`);
         }
      });

      await pool(tasks, CONCURRENCY);

      console.log(`\n\n🎉  Done!  ${done} uploaded, ${failed} failed.`);
      console.log(`   Bucket prefix: ${process.env.AWS_BUCKET}/${PREFIX}`);
   } finally {
      console.log(`\n🧹  Cleaning up ${tmpDir} …`);
      await rm(tmpDir, { recursive: true, force: true });
      console.log("✅  Cleaned up.");
   }
}

main().catch((err) => {
   console.error("Fatal:", err);
   process.exit(1);
});
