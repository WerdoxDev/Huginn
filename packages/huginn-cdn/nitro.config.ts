import { join } from "pathe";

//https://nitro.unjs.io/config
export default defineNitroConfig({
	srcDir: "src",
	compatibilityDate: "2025-01-20",
	errorHandler: join(process.cwd().includes("shared") ? process.argv[2] : process.cwd(), "src/utils/error-handler.ts"),
	preset: "bun",
});
