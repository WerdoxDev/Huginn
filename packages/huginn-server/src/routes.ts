import { join } from "@std/path";

export async function recursiveReaddir(path: string) {
	const files: string[] = [];
	const getFiles = async (path: string) => {
		for await (const dirEntry of Deno.readDir(path)) {
			if (dirEntry.isDirectory) {
				await getFiles(dirEntry.name);
			} else if (dirEntry.isFile) {
				files.push(dirEntry.name);
			}
		}
	};
	await getFiles(path);
	return files;
}

export async function importRoutes() {
	const routes = (await recursiveReaddir(join(Deno.cwd(), "src", "routes", "api", "auth"))).filter((file) => file.endsWith(".ts"));

	for (const route of routes) {
		console.log(route);
		const fixedRoute = `routes/api/auth/${route}`;
		await import(`./${fixedRoute}`);
		// await import(`./${fixedRoute}`);
	}
}
