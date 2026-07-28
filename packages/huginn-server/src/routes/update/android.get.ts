import Elysia, { t } from "elysia";
import * as semver from "semver";

import { getAllTags, getReleaseByTag } from "#utils/route-utils";

export const getAndroidUpdate = new Elysia().get(
   "/api/update/android/:file",
   async ({ params: { file }, request, status }) => {
      if (file !== "manifest.json" && !file.endsWith(".zip")) {
         return status("Not Found");
      }

      const tags = await getAllTags();
      const [latestTag] = tags
         .filter((tag) => tag.name.startsWith("app@v"))
         .toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

      if (!latestTag) {
         return status("No Content");
      }

      const latestRelease = await getReleaseByTag(latestTag.name);
      const asset = latestRelease.assets.find((asset) => asset.name === file);

      if (!asset) {
         return status("Not Found");
      }

      const range = request.headers.get("range");

      const upstream = await fetch(asset.browser_download_url, {
         headers: range ? { range } : undefined,
      });

      if (!upstream.ok && upstream.status !== 206) {
         return status("Bad Gateway");
      }

      const headers = new Headers();
      headers.set("content-type", file === "manifest.json" ? "application/json" : "application/zip");
      headers.set("accept-ranges", "bytes");

      for (const header of ["content-length", "content-range", "etag", "last-modified"]) {
         const value = upstream.headers.get(header);
         if (value) headers.set(header, value);
      }

      return new Response(upstream.body, {
         status: upstream.status,
         headers,
      });
   },
   {
      params: t.Object({ file: t.String() }),
   },
);
