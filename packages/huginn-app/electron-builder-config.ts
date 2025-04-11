import type { Configuration } from "electron-builder";

export default {
	productName: "Huginn",
	appId: "dev.huginn.desktop",
	electronLanguages: ["en-US"],
	compression: "store",
	win: {
		target: { target: "nsis", arch: ["x64"] },
		publish: {
			provider: "generic",
			url: "https://midgard.huginn.dev/api/update/${os}",
			useMultipleRangeRequest: true,
		},
		icon: "assets/icon.ico",
	},
	artifactName: "${productName}_${version}_${arch}-setup.${ext}",
	files: ["dist/**/*", "!dist/electron", "!node_modules/**/*", ".vite/build/**/*"],
	directories: {
		output: "dist/electron",
	},
	icon: "assets/icon.ico",
	extraResources: ["assets"],
} as Configuration;
