import { version } from "../package.json";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = "WerdoxDev";
const REPO = "Huginn";
const TAG = `app@v${version}`;

const args = process.argv.slice(2);
const modeIndex = args.indexOf("--mode");
const mode = modeIndex !== -1 ? args[modeIndex + 1] : null;

if (!mode || !["windows", "android"].includes(mode)) {
   console.error("Usage: bun upload.ts --mode <windows|android>");
   process.exit(1);
}

const FILES: Record<string, { path: string; name: string; type: string }[]> = {
   windows: [
      {
         path: `./dist/electron/Huginn_${version}_x64-setup.exe`,
         name: `Huginn_${version}_x64-setup.exe`,
         type: "application/octet-stream",
      },
      {
         path: `./dist/electron/Huginn_${version}_x64-setup.exe.blockmap`,
         name: `Huginn_${version}_x64-setup.exe.blockmap`,
         type: "application/octet-stream",
      },
      {
         path: "./dist/electron/latest.yml",
         name: "latest.yml",
         type: "text/yaml",
      },
   ],
   android: [
      {
         path: `./android/app/outputs/apk/release/app-release.apk`,
         name: `Huginn_${version}.apk`,
         type: "application/octet-stream",
      },
      {
         path: `./dev.huginn_${version}.zip`,
         name: `dev.huginn_${version}.zip`,
         type: "application/zip",
      },
      {
         path: "./checksum.txt",
         name: "checksum.txt",
         type: "text/plain",
      },
   ],
};

async function getReleaseByTag() {
   const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`, {
      headers: {
         Authorization: `Bearer ${GITHUB_TOKEN}`,
         Accept: "application/vnd.github+json",
      },
   });

   if (!res.ok) {
      throw new Error(`Failed to get release: ${res.statusText}`);
   }

   const release = await res.json();
   return release;
}

async function uploadAsset(uploadUrl: string, files: (typeof FILES)[string]) {
   for (const file of files) {
      const fileBuffer = await Bun.file(file.path).arrayBuffer();
      const finalUrl = `${uploadUrl.replace(/\{\?name,label\}/, "")}?name=${encodeURIComponent(file.name)}`;

      console.log("Uploading", file.name);

      const res = await fetch(finalUrl, {
         method: "POST",
         headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            "Content-Type": file.type,
            "Content-Length": fileBuffer.byteLength.toString(),
         },
         body: fileBuffer,
      });

      if (!res.ok) {
         throw new Error(`Failed to upload asset: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Asset uploaded:", data.browser_download_url);
   }
}

try {
   const release = await getReleaseByTag();
   await uploadAsset(release.upload_url, FILES[mode]);
} catch (err) {
   console.error("Error:", err);
}
