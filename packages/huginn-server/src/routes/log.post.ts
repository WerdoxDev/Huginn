import { appendFile, mkdir } from "node:fs/promises";
import { createRoute, validator } from "@huginn/backend-shared";
import pathe from "pathe";
import z from "zod";
import { verifyToken } from "#utils/token-factory";

const schema = z.object({ token: z.optional(z.string()), logs: z.array(z.object({ section: z.string(), level: z.string(), args: z.array(z.any()) })) })

createRoute("POST", "/api/log", validator("json", schema), async (c) => {
   const body = c.req.valid("json");
   const { payload } = await verifyToken(body.token ?? "");

   const now = new Date();

   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, '0');
   const day = String(now.getDate()).padStart(2, '0');
   const hour = String(now.getHours()).padStart(2, '0');

   const dateDir = `${year}-${month}-${day}`;
   const logDir = pathe.resolve(import.meta.dir, "..", "..", "logs", payload?.id || "anonymous", dateDir);
   const logFile = pathe.join(logDir, `${hour}.txt`);

   const logLines = `${body.logs.map(x => `(${x.section}) [${x.level}] ${x.args.join(" ")}`).join("\n")}\n`;

   await mkdir(logDir, { recursive: true });
   await appendFile(logFile, logLines);

   return c.newResponse(null, 200);
})
