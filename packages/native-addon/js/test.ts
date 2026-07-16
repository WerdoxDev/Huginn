import Bun from "bun";

import addon from "./index";

const t0 = performance.now();
const path = "C:\\Users\\matin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";
const path2 = "C:\\Windows\\SystemApps\\ShellExperienceHost_cw5n1h2txyewy\\ShellExperienceHost.exe";
const path3 = "D:\\Xbox\\Kingdom Two Crowns\\Content\\KingdomTwoCrowns.exe";
const path4 = "C:\\Program Files\\WindowsApps\\Microsoft.WindowsStore_22507.1401.7.0_x64__8wekyb3d8bbwe";
const path5 =
   "C:\\Users\\matin\\AppData\\Local\\Packages\\Microsoft.4297127D64EC6_8wekyb3d8bbwe\\LocalCache\\Local\\runtime\\java-runtime-delta\\windows-x64\\java-runtime-delta\\bin\\javaw.exe";
const path6 = "C:\\Program Files\\WindowsApps\\SpotifyAB.SpotifyMusic_1.272.438.0_x64__zpdnekdrzrea0\\Spotify.exe";
const path7 = "D:\\Xbox\\Forza Horizon 6\\Content\\forzahorizon6.exe";

const applications = addon.getOpenApplications();
console.log(applications.length);

let index = 0;
for (const application of applications) {
   const processId = application.processId;
   const info = addon.getApplicationInfo(processId);
   const thumb = addon.getWindowThumbnailBase64(application.hwnd, 256, 256);
   if (!info) continue;
   // console.log(info.displayName ? info.displayName : application.windowTitle);
   const name = index.toString();

   if (!info.icon) {
      console.warn("No icon for", name, processId);
   } else {
      await new Bun.Image(info.icon).png().write("./test-out/" + name + ".png");
   }

   if (!thumb) {
      console.warn("No thumbnail for", name, processId);
   } else {
      await new Bun.Image(thumb).png().write("./test-out/" + name + "-thumb.png");
   }

   index++;
}

// const screen1 = addon.getScreenThumbnailBase64(0, 0, 2560, 1440, 1);
const screen2 = addon.getScreenThumbnailBase64(-1707, 258, 1707, 960, 1.5);

// if (!screen1) {
//    console.warn("No screen thumbnail for 0,0,2560,1440");
// } else {
//    await new Bun.Image(screen1).png().write("./test-out/screen-0.png");
// }

if (!screen2) {
   console.warn("No screen thumbnail for -1707,258,1707,960");
} else {
   await new Bun.Image(screen2).png().write("./test-out/screen-1.png");
}
