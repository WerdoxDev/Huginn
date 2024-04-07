import { AppVersionInfo } from "@/index";
import { handleRequest } from "@/src/route-utils";
import { Hono } from "hono";
import { readdir } from "node:fs/promises";
import { semver } from "bun";
import { HttpCode } from "@shared/errors";
import path from "path";

const app = new Hono();

app.get("/check-update/:target/:arch/:currentVersion", c =>
   handleRequest(c, async () => {
      const debugBuildsPath = "/home/werdox-wsl/Huginn/packages/huginn-server/builds/debug/";
      const versionFolders = (await readdir(debugBuildsPath)).sort(semver.order).reverse();
      const latestVersion = versionFolders[0];

      const target = c.req.param("target");
      const arch = c.req.param("arch");
      const currentVersion = c.req.param("currentVersion");

      if (semver.order(currentVersion, latestVersion) !== -1) {
         return c.newResponse(null, HttpCode.NO_CONTENT);
      }

      if (target === "windows" && arch === "x86_64") {
         const releaseFiles = await readdir(path.resolve(debugBuildsPath, latestVersion));

         const zipFileName = releaseFiles.find(x => x.endsWith(".zip"))!;
         const zipFile = Bun.file(path.resolve(debugBuildsPath, latestVersion, zipFileName));
         const sigFileContent = await Bun.file(
            path.resolve(debugBuildsPath, latestVersion, releaseFiles.find(x => x.endsWith(".sig"))!),
         ).text();

         const result: AppVersionInfo = {
            version: latestVersion,
            url: `http://87.170.235.188:3000/builds/debug/${latestVersion}/${zipFileName}`,
            signature: sigFileContent,
            pub_date: new Date(zipFile.lastModified).toISOString(),
            notes: "New version!",
         };

         return c.json(result);
      }

      return c.newResponse(null, HttpCode.NO_CONTENT);
   }),
);

export default app;
