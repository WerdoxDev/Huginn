import fs from "node:fs/promises";
import { createRoute, validator } from "@huginn/backend-shared";
import pathe from "pathe";
import z from "zod";
import { getConnInfo } from "hono/bun";
import { CacheStorage } from "@huginn/shared";

const schema = z.object({
   clientId: z.string(),
   systemInfo: z.optional(
      z.object({
         platform: z.string(),
         arch: z.string(),
         version: z.string(),
         appVersion: z.string(),
         locale: z.string(),
      }),
   ),
   timestamp: z.string(),
   logs: z.array(
      z.object({
         type: z.string(),
         timestamp: z.string(),
         section: z.string(),
         level: z.optional(z.string()),
         args: z.array(z.any()),
      }),
   ),
});

type GeoData = { country?: string; city?: string; timezone?: string };
const ipCache = new CacheStorage<string, GeoData>(undefined);

createRoute("POST", "/api/log", validator("json", schema), async (c) => {
   const body = c.req.valid("json");

   const ip = getConnInfo(c).remote.address;
   let geoData: GeoData | undefined;
   if (ip) {
      geoData = await ipCache.cacheOrGet(ip, async () => {
         const data = await (await fetch(`https://ipapi.co/${ip}/json`)).json();
         return data as GeoData;
      });
   }

   const maxFileSize = 10 * 1024 * 1024;

   let fileIndex = 1;
   let currentFile;
   const logsDir = pathe.resolve(import.meta.dir, "..", "..", "logs", new Date().toISOString().split("T")[0]);

   while (true) {
      currentFile = pathe.join(logsDir, `${body.clientId}-${fileIndex}.json`);
      try {
         const stats = await fs.stat(currentFile);

         // this file hasn't reached the maximum yet so we'll append to it
         if (stats.size < maxFileSize) {
            break;
         }

         fileIndex++;
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         // the file doesn't exist so we'll create it
         await fs.mkdir(logsDir, { recursive: true });
         await fs.writeFile(currentFile, "[]", "utf-8");
         break;
      }
   }

   const logData = {
      clientId: body.clientId,
      systemInfo: body.systemInfo,
      timestamp: body.timestamp,
      ip: ip,
      country: geoData?.country,
      city: geoData?.city,
      timezone: geoData?.timezone,
      logs: body.logs,
   };

   const existingData = await fs.readFile(currentFile, "utf-8").catch(() => "[]");
   const existingLogs = JSON.parse(existingData);
   const updatedLogs = [...existingLogs, logData];
   await fs.writeFile(currentFile, JSON.stringify(updatedLogs, null, 2));

   return c.newResponse(null, 200);
});
