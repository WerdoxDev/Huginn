import { createHash } from "crypto";
import { readFileSync } from "fs";
import * as v8 from "node:v8";

const t0 = performance.now();
const filePath = "C:\\Users\\matin\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";
console.log(process.memoryUsage());
const fileBuffer = readFileSync(filePath);
const hash = createHash("sha256").update(fileBuffer).digest("hex");
console.log(process.memoryUsage());
const t1 = performance.now();

console.log(`SHA-256: ${hash}`, t1 - t0);
