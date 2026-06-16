import { $ } from "bun";

const zipOutput = await $`bunx @capgo/cli bundle zip --path ./dist/ --json`.text();

// Extract just the JSON part (the command has extra output before it)
const json = JSON.parse(zipOutput.match(/\{[\s\S]*\}/)?.[0] ?? "");
const { checksum } = json;

await Bun.write("./checksum.txt", checksum);
console.log(`Checksum written: ${checksum}`);
