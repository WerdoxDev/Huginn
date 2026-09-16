import Elysia, { t } from "elysia";
import * as semver from "semver";

import { getAllTags, getReleaseByTag } from "#utils/route-utils";

type DesktopUpdatePlatform = "windows" | "linux";

const MANIFEST_BY_PLATFORM: Record<DesktopUpdatePlatform, string> = {
   windows: "latest.yml",
   linux: "latest-linux.yml",
};

async function handleDesktopUpdate(platform: DesktopUpdatePlatform, file: string, request: Request) {
   const manifest = MANIFEST_BY_PLATFORM[platform];

   if (file === manifest) {
      const tags = await getAllTags();
      const [latestTag] = tags
         .filter((x) => x.name.startsWith("app@v"))
         .toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

      if (!latestTag) {
         return new Response(null, { status: 204 });
      }

      const release = await getReleaseByTag(latestTag.name);
      const manifestAsset = release.assets.find((x) => x.name === manifest);
      if (!manifestAsset) {
         return new Response(null, { status: 404 });
      }

      const manifestResponse = await fetch(manifestAsset.browser_download_url);
      if (!manifestResponse.ok) {
         return new Response(null, { status: 502 });
      }

      return new Response(manifestResponse.body, {
         headers: { "content-type": "text/yaml" },
      });
   }

   const version = file.match(/_([\d.]+)_/)?.[1];
   if (!version) {
      return new Response(null, { status: 404 });
   }

   const release = await getReleaseByTag(`app@v${version}`);
   const asset = release.assets.find((x) => x.name === file);
   if (!asset) {
      return new Response(null, { status: 404 });
   }

   const range = request.headers.get("range");
   const upstream = await fetch(asset.browser_download_url, {
      headers: range ? { range } : undefined,
   });

   if (!upstream.ok && upstream.status !== 206) {
      return new Response(null, { status: 502 });
   }

   const headers = new Headers();
   headers.set("content-type", "application/octet-stream");
   headers.set("content-disposition", `attachment; filename="${asset.name}"`);
   headers.set("accept-ranges", "bytes");

   const contentLength = upstream.headers.get("content-length");
   if (contentLength) headers.set("content-length", contentLength);

   const contentRange = upstream.headers.get("content-range");
   if (contentRange) headers.set("content-range", contentRange);

   return new Response(upstream.body, {
      status: upstream.status,
      headers,
   });
}

const routeOptions = { params: t.Object({ file: t.String() }) };

export const getDesktopUpdate = new Elysia()
   .get("/api/update/windows/:file", ({ params: { file }, request }) => handleDesktopUpdate("windows", file, request), routeOptions)
   .get("/api/update/linux/:file", ({ params: { file }, request }) => handleDesktopUpdate("linux", file, request), routeOptions);
