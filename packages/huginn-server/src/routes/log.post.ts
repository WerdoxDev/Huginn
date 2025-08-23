import { appendFile, mkdir } from "node:fs/promises";
import { createRoute, validator } from "@huginn/backend-shared";
import pathe from "pathe";
import z from "zod";
import { verifyToken } from "#utils/token-factory";

const schema = z.object({
   token: z.optional(z.string()),
   logs: z.array(z.object({ type: z.string(), section: z.string(), level: z.optional(z.string()), args: z.array(z.any()) })),
});

createRoute("POST", "/api/log", validator("json", schema), async (c) => {
   const body = c.req.valid("json");
   const { payload } = await verifyToken(body.token ?? "");

   const now = new Date();

   const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));

   const year = berlin.getFullYear();
   const month = String(berlin.getMonth() + 1).padStart(2, "0");
   const day = String(berlin.getDate()).padStart(2, "0");
   const hour = String(berlin.getHours()).padStart(2, "0");

   const dateDir = `${year}-${month}-${day}`;
   const logDir = pathe.resolve(import.meta.dir, "..", "..", "logs", payload?.id || "anonymous", dateDir);
   const logFile = pathe.join(logDir, `${hour}.txt`);
   const formatted = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Europe/Berlin",
   });

   const logLines = `${formatted}\n ${body.logs.map((x) => `${x.type === "error" ? "ERROR: " : ""}(${x.section}) [${x.level}] ${x.args.join(" ")}`).join("\n")}\n`;

   await mkdir(logDir, { recursive: true });
   await appendFile(logFile, logLines);

   return c.newResponse(null, 200);
});
