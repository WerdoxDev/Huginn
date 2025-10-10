import path from "pathe";
const argv = process.argv.slice(2);
const filepath = path.resolve(argv[0]);
const outputPath = path.resolve(argv[1]);

const json = await Bun.file(filepath).json();

const finalLines: string[] = [];

for (const entry of json) {
   const logs = entry.logs;
   for (const log of logs) {
      finalLines.push(`${log.timestamp} ${log.section} ${log.level} ${log.args.join(" ")}`);
   }
}

// const filename = `${path.basename(filepath)}-converted`;
await Bun.file(outputPath).write(finalLines.join("\n"));
