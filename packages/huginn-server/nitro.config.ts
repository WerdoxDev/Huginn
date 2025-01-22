import { join } from "pathe";

//https://nitro.unjs.io/config
export default defineNitroConfig({
	srcDir: "src",
	compatibilityDate: "2025-01-20",
	errorHandler: join(process.cwd(), "src/utils/error-handler.ts"),
	experimental: { websocket: true },
	preset: "bun",
});
