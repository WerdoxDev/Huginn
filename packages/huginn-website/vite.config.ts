import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [react(), tailwindcss()],
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
});
