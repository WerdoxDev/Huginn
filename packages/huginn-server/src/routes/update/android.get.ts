import Elysia, { t } from "elysia";

import { getAllAppReleases } from "#utils/route-utils";

import { getLatestCompatibleAndroidRelease } from "./android-update";

export const getAndroidUpdate = new Elysia().get(
   "/api/update/android/:file",
   {
      params: t.Object({ file: t.String() }),
      query: t.Object({ nativeVersion: t.Optional(t.String()) }),
   },
   async ({ params: { file }, query: { nativeVersion }, request, status }) => {
      if (file !== "manifest.json" && !file.endsWith(".zip")) {
         return status("Not Found");
      }

      const releases = await getAllAppReleases();
      const latestCompatibleRelease = getLatestCompatibleAndroidRelease(releases, nativeVersion);

      if (!latestCompatibleRelease) {
         return status("No Content");
      }

      const asset = latestCompatibleRelease.assets.find((asset) => asset.name === file);

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
);
