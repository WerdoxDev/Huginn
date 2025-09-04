import addon from "./index";

const t0 = performance.now();
const path = "C:\\Users\\matin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";
const hash = addon.getFileSha256(path);
const icon = addon.getExeLargeIcon(path);
const t1 = performance.now();
console.log(hash, icon, t1 - t0);
