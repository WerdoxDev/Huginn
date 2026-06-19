import { spawn } from "bun";

try {
   const frontend = spawn(["bun", "run", "vite:dev", "--mode", "electron"], {
      stdin: "inherit",
      stdout: "inherit",
      cwd: process.cwd(),
   });
   // for await (const chunk of frontend.stdout) {
   //    const line = decoder.decode(chunk);
   //    process.stdout.write(chunk);
   //    if (line.includes("ready") && !electron) {
   const electron = spawn(["bun", "run", "electron:run", ...process.argv.slice(2)], {
      stdin: "inherit",
      stdout: "inherit",
      cwd: process.cwd(),
      env: {
         ...(process.env as Record<string, string>),
         VITE_DEV_SERVER_URL: "http://localhost:5174",
      },
   });
   //       });
   //    }
   // }
} catch (e) {
   console.error("Error starting app: ", e);
   process.exit(1);
}
