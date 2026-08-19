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

const androidFiles = [
   {
      path: `./android/app/build/outputs/apk/release/app-release.apk`,
      name: `Huginn_${version}.apk`,
      type: "application/octet-stream",
   },
   {
      path: `./android-releases/Huginn-android-${version}.zip`,
      name: `Huginn-android-${version}.zip`,
      type: "application/zip",
   },
   {
      path: "./android-releases/manifest.json",
      name: "manifest.json",
      type: "application/json",
   },
];

if (process.env.ANDROID_REQUIRES_NATIVE_UPDATE === "true") {
   androidFiles.push({
      path: "./android-releases/android-native-cut.json",
      name: "android-native-cut.json",
      type: "application/json",
   });
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
   android: androidFiles,
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
