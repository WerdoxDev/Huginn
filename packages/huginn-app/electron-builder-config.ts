import type { Configuration } from "electron-builder";

export default {
	productName: "Huginn",
	appId: "dev.huginn.desktop",
	electronLanguages: ["en-US"],
	compression: "maximum",
	win: {
		target: { target: "nsis", arch: ["x64"] },
		publish: [
			{
				provider: "generic",
				url: "http://localhost:3004/api/update/${os}",
				useMultipleRangeRequest: true,
			},
		],
	},
	artifactName: "${productName}_${version}_${arch}-setup.${ext}",
	files: ["dist/**/*", "!dist/electron", "!node_modules/**/*", ".vite/build/**/*"],
	directories: {
		app: ".",
		output: "dist/electron",
	},
} as Configuration;
