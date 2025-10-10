import fs from "node:fs/promises";
import pathe from "pathe";
import { CacheStorage } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({
   clientId: t.String(),
   systemInfo: t.Optional(
      t.Object({
         platform: t.String(),
         arch: t.String(),
         version: t.String(),
         release: t.String(),
         appVersion: t.String(),
      }),
   ),
   timestamp: t.String(),
   logs: t.Array(
      t.Object({
         type: t.String(),
         timestamp: t.String(),
         section: t.String(),
         level: t.Optional(t.String()),
         args: t.Array(t.Any()),
      }),
   ),
});

type GeoData = { ip?: string; country?: string; city?: string; region?: string; timezone?: string; org?: string };
const ipCache = new CacheStorage<string, GeoData>(undefined);

export const postLog = new Elysia().post(
   "/api/log",
   async ({ status, body, headers }) => {
      const ip = headers["x-real-ip"];

      let geoData: GeoData | undefined;
      if (ip) {
         geoData = await ipCache.cacheOrGet(ip, async () => {
            const data = await (await fetch(`https://ipapi.co/${ip}/json`)).json();

            return { country: data?.country, city: data?.city, timezone: data?.timezone, region: data?.region, org: data?.org };
         });
         geoData.ip = ip;
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
         timestamp: body.timestamp,
         systemInfo: body.systemInfo,
         geoData,
         logs: body.logs,
      };

      const existingData = await fs.readFile(currentFile, "utf-8").catch(() => "[]");
      const existingLogs = JSON.parse(existingData);
      const updatedLogs = [...existingLogs, logData];
      await fs.writeFile(currentFile, JSON.stringify(updatedLogs, null, 2));

      return status("OK");
   },
   { body: schema },
);
