import fs from "node:fs/promises";
import { join, normalize } from "pathe";

export async function importRoutes(log?: boolean): Promise<void> {
	const routes = (await fs.readdir(join(process.cwd(), "src/routes"), { recursive: true })).filter((file) => file.endsWith(".ts"));

	for (const route of routes) {
		const fixedRoute = `./src/routes/${route.replace(".ts", "")}`;
		const importPath = normalize(join(process.cwd(), fixedRoute));
		await import(importPath);
	}
}
