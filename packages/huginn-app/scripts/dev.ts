import { spawn } from "bun";

try {
	const frontend = spawn(["bun", "run", "vite:dev"], { stdin: "inherit", stdout: "pipe", cwd: process.cwd() });
	let electron: Bun.Subprocess | undefined = undefined;
	const decoder = new TextDecoder();
	for await (const chunk of frontend.stdout) {
		const line = decoder.decode(chunk);
		process.stdout.write(chunk);
		if (line.includes("ready") && !electron) {
			electron = spawn(["bun", "run", "electron:run", ...process.argv.slice(2)], {
				stdin: "inherit",
				stdout: "inherit",
				cwd: process.cwd(),
				env: { ...(process.env as Record<string, string>), VITE_DEV_SERVER_URL: "http://localhost:5173" },
			});
		}
	}
} catch (e) {
	console.error("Error starting app: ", e);
	process.exit(1);
}
