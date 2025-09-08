import addon from "./index";

const t0 = performance.now();
const path = "C:\\Users\\matin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";
const path2 = "C:\\Windows\\SystemApps\\ShellExperienceHost_cw5n1h2txyewy\\ShellExperienceHost.exe";
const path3 = "D:\\Xbox\\Kingdom Two Crowns\\Content\\KingdomTwoCrowns.exe";

// const hash = addon.getFileSha256(path);
const icon = addon.getExeLargeIcon(path3, 21940);
// console.log(addon.enumerateOpenApplications());
const t1 = performance.now();
console.log(t1 - t0, icon);
