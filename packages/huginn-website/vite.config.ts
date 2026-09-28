import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import AutoImport from "unplugin-auto-import/vite";
import IconsResolver from "unplugin-icons/resolver";
import Icons from "unplugin-icons/vite";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [
      tanstackRouter({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      Icons({ compiler: "jsx" }),
      AutoImport({
         resolvers: [IconsResolver({ prefix: "Icon", extension: "jsx" })],
         include: [/\.[jt]sx?$/, /tsr-split/],
      }),
   ],
   //   server: {
   //     proxy: {
   //       "/app": {
   //         target: "http://localhost:5174", // your React app's local port
   //         changeOrigin: true,
   //         ws: true,
   //         // rewrite: (path) => path.replace(/^\/app/, ""),
   //       },
   //     },
   //   },
   resolve: {
      alias: {
         "@": path.join(import.meta.dirname, "./src"),
         "@lib": path.join(import.meta.dirname, "./src/lib"),
         "@hooks": path.join(import.meta.dirname, "./src/hooks"),
         "@contexts": path.join(import.meta.dirname, "./src/contexts"),
         "@components": path.join(import.meta.dirname, "./src/components"),
         "@stores": path.join(import.meta.dirname, "./src/stores"),
      },
   },
});
