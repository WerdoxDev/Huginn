import { defineConfig, minimal2023Preset as preset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
   preset: { apple: { sizes: [180] }, maskable: { sizes: [192, 512] }, transparent: { sizes: [64, 192, 512], favicons: [[96, "favicon.ico"]] } },
   images: ["public/favicon.png"],
});
