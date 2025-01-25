import { argv } from "bun";
import { join, resolve } from "pathe";

//https://nitro.unjs.io/config
export default defineNitroConfig({
	srcDir: "src",
	compatibilityDate: "2025-01-20",
	errorHandler: join(argv[2] ?? process.cwd(), "src/utils/error-handler.ts"),
	preset: "bun",
});
