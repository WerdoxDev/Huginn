import { defineConfig } from "@vite-pwa/assets-generator/config";

export default defineConfig({
   preset: {
      apple: { sizes: [180], resizeOptions: { background: "#EBEBD3" } },
      maskable: { sizes: [192, 512], resizeOptions: { background: "#EBEBD3" } },
      transparent: { sizes: [64, 192, 512], favicons: [[96, "favicon.ico"]] },
      png: { compressionLevel: 0, quality: 100, colors: 3 },
   },
   images: ["public/icon-outline.png"],
});
