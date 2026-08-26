import Elysia, { t } from "elysia";
import * as semver from "semver";

import { octokit } from "#server";
import { env } from "#setup";
import { getAllTags, getReleaseByTag } from "#utils/route-utils";

export const getWinUpdate = new Elysia().get(
   "/api/update/win/:file",
   {
      params: t.Object({ file: t.String() }),
   },
   async ({ status, params: { file }, request }) => {
      const tags = await getAllTags();

      // Non-manifest request: stream the actual asset bytes from our own server
      if (file !== "latest.yml") {
         const version = file.match(/_([\d.]+)_/)?.[1];
         const tag = `app@v${version}`;
         const release = await getReleaseByTag(tag);

         const asset = release.assets.find((x) => x.name === file);
         if (!asset) {
            return status("Not Found");
         }

         // Forward the Range header so differential/delta downloads keep working
         const range = request.headers.get("range");

         const upstream = await fetch(asset.browser_download_url, {
            headers: range ? { range } : undefined,
         });

         if (!upstream.ok && upstream.status !== 206) {
            return status("Bad Gateway");
         }

         const headers = new Headers();
         headers.set("content-type", "application/octet-stream");
         headers.set("content-disposition", `attachment; filename="${asset.name}"`);
         headers.set("accept-ranges", "bytes");

         const contentLength = upstream.headers.get("content-length");
         if (contentLength) headers.set("content-length", contentLength);

         const contentRange = upstream.headers.get("content-range");
         if (contentRange) headers.set("content-range", contentRange);

         // Stream the body straight through instead of buffering it in memory
         return new Response(upstream.body, {
            status: upstream.status, // 200 or 206
            headers,
         });
      }

      // Manifest request: unchanged — already served directly, not redirected
      const [latestTag] = tags
         .filter((x) => x.name.startsWith("app@v"))
         .toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

      const latestVersion = latestTag?.name.replace("app@v", "");

      if (!latestVersion) {
         return status("No Content");
      }

      const latestRelease = await octokit.rest.repos.getReleaseByTag({
         owner: env.REPO_OWNER,
         repo: env.REPO,
         tag: latestTag.name,
      });

      const latestYmlUrl = latestRelease.data.assets.find((x) => x.name === "latest.yml")?.browser_download_url;
      const latestInfo = await (await fetch(latestYmlUrl ?? "")).arrayBuffer();

      return new Response(latestInfo, {
         headers: { "content-type": "text/yaml" },
      });
   },
);
