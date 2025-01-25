import { HTTPError, HuginnAPIError, type HuginnErrorData } from "@huginn/shared";
import { $ } from "bun";
import { waitForPort } from "get-port-please";
import { type Nitro, createNitro } from "nitropack";
import { join, normalize, resolve } from "pathe";

export type TestContext = {
	nitro: Nitro;
	server?: { url: string };
};

let currentContext: TestContext | undefined;
export async function getContext(options?: { rootDir?: string }): Promise<TestContext> {
	if (!currentContext) {
		const rootDir = normalize(options?.rootDir ?? process.cwd());

		const outDir = resolve(rootDir, ".output");

		const ctx: TestContext = {
			nitro: await createNitro(
				{
					preset: "bun",
					dev: false,
					rootDir: rootDir,
					buildDir: join(outDir, ".nitro"),
					srcDir: join(rootDir, "src"),
					serveStatic: true,
					output: {
						dir: outDir,
					},
					// routesDir: join(rootDir, "src/routes"),
					// apiDir: join(rootDir, "src/api"),
					timing: true,
					inlineDynamicImports: true,
					replace: {
						"import.meta.test": JSON.stringify(true),
					},
				},
				{ compatibilityDate: "2025-01-20" },
			),
		};

		currentContext = ctx;
	}

	return currentContext;
}

export async function startServer(): Promise<void> {
	const ctx = await getContext();

	if (!ctx) {
		throw new Error("Nitro test context is not initialized.");
	}

	await $`bun ../huginn-backend-shared/src/build-server.ts`.quiet();

	const child = Bun.spawn(["bun", resolve(ctx.nitro.options.output.dir, "server/index.mjs")], {
		env: { NITRO_PORT: "3004" },
		stdout: "pipe",
		stderr: "pipe",
	});

	await waitForServer(child.stdout);
	ctx.server = { url: "http://localhost:3004" };
}

async function waitForServer(stream: ReadableStream<Uint8Array<ArrayBufferLike>>) {
	const reader = stream.getReader();
	let done = false;
	let value: Uint8Array | undefined;
	let outputBuffer = "";

	do {
		// Read a chunk from the stream
		({ done, value } = await reader.read());

		if (!done) {
			const output = new TextDecoder().decode(value);
			outputBuffer += output;

			if (outputBuffer.includes("> Nitro Start")) {
				break; // Exit the loop if desired text is found
			}
		}
	} while (!done);

	await waitForPort(3004);
}

export async function testHandler(
	path: string,
	headers: Record<string, string>,
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
	body?: unknown,
	returnAsRaw?: boolean,
): Promise<unknown> {
	const ctx = await getContext();
	const url = new URL(path, ctx.server?.url).toString();

	let finalBody: unknown;
	const finalHeaders: Record<string, string> = headers;

	if (body && typeof body === "object" && method !== "GET") {
		if (body instanceof FormData) {
			finalBody = body;
		} else {
			finalHeaders["Content-Type"] = "application/json";
			finalBody = JSON.stringify(body);
		}
	}

	const response = await fetch(url, { headers: finalHeaders, method, body: finalBody as BodyInit, redirect: "manual" });

	let responseBody: unknown;
	const headersMap = new Map(response.headers);
	if (headersMap.get("content-type")?.startsWith("application/json")) {
		responseBody = await response.json();
	}

	if (response.status >= 200 && response.status < 300) {
		return returnAsRaw ? response : responseBody;
	}

	if (response.status >= 300 && response.status < 400) {
		return response;
	}

	if (response.status >= 400 && response.status < 500) {
		let error: HuginnAPIError;
		try {
			// console.log(responseBody);
			const errorData = responseBody as HuginnErrorData;
			error = new HuginnAPIError(errorData, errorData.code, response.status, method, path, { body });
		} catch (e) {
			throw new HTTPError(response.status, response.statusText, method, path, { body });
		}

		if (error) {
			throw error;
		}
	}

	if (response.status >= 500 && response.status < 600) {
		throw new HTTPError(response.status, response.statusText, method, path, { body });
	}
}
