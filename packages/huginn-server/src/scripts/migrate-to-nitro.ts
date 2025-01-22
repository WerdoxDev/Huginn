import fs from "node:fs/promises";
import path from "node:path";

const routes = (await fs.readdir(path.join(__dirname, "../-api"), { recursive: true })).filter((file) => file.endsWith(".ts"));

for (const route of routes) {
	const fixedRoute = path.resolve(`src/-api/${route}`);
	const content = await Bun.file(fixedRoute).text();

	let finalContent = "";
	let reachedRouter = false;
	for (const line of content.split("\n")) {
		if (line.startsWith("router.")) {
			continue;
		}
		if (line.trim().startsWith('"/')) {
			continue;
		}
		if (line.trim().startsWith("defineEventHandler")) {
			finalContent += `export default ${line}\n`;
			reachedRouter = true;
			continue;
		}

		if (reachedRouter) {
			if (line.trim() === "}),") {
				finalContent += "});\n";
				continue;
			}
			if (line.trimEnd() === ");") {
				continue;
			}
		}

		finalContent += `${line}\n`;
	}

	console.log(finalContent);

	await Bun.write(fixedRoute, finalContent);
}
