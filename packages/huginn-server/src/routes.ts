import fs from "node:fs/promises";

export async function importRoutes(log?: boolean) {
	const routes = (await fs.readdir(`${__dirname}/routes`, { recursive: true })).filter((file) => file.endsWith(".ts"));

	for (const route of routes) {
		if (log) console.log(route);
		const fixedRoute = `./routes/${route.replace(".ts", "")}`;
		await import(fixedRoute);
	}
}
