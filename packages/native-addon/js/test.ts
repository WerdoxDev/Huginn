import addon from "./index";

const t0 = performance.now();
const path = "C:\\Users\\matin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";
const path2 = "C:\\Windows\\SystemApps\\ShellExperienceHost_cw5n1h2txyewy\\ShellExperienceHost.exe";
const path3 = "D:\\Xbox\\Kingdom Two Crowns\\Content\\KingdomTwoCrowns.exe";
const path4 = "C:\\Program Files\\WindowsApps\\Microsoft.WindowsStore_22507.1401.7.0_x64__8wekyb3d8bbwe";
const path5 =
   "C:\\Users\\matin\\AppData\\Local\\Packages\\Microsoft.4297127D64EC6_8wekyb3d8bbwe\\LocalCache\\Local\\runtime\\java-runtime-delta\\windows-x64\\java-runtime-delta\\bin\\javaw.exe";
const path6 = "C:\\Program Files\\WindowsApps\\SpotifyAB.SpotifyMusic_1.272.438.0_x64__zpdnekdrzrea0\\Spotify.exe";
// const hash = addon.getFileSha256(path);

// const apps = addon.getOpenApplications();
// console.log(apps);
const info = addon.getApplicationInfo(path6, 15284).then((x) => {
   const t1 = performance.now();
   console.log(t1 - t0, x);
});
// // console.log(addon.enumerateOpenApplications());
