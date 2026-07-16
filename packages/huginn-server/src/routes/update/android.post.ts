import Elysia, { t } from "elysia";
import * as semver from "semver";

import { octokit } from "#server";
import { env } from "#setup";
import { getAllTags, getReleaseByTag } from "#utils/route-utils";

const schema = t.Object({
   version_name: t.String(),
   version_build: t.String(),
   version_os: t.String(),
   plugin_version: t.String(),
   platform: t.String(),
   app_id: t.String(),
   device_id: t.String(),
   custom_id: t.Optional(t.String()),
   is_prod: t.Optional(t.Boolean()),
   is_emulator: t.Optional(t.Boolean()),
});

const releasePrefix = "app@v";

export const postAndroidUpdate = new Elysia().post(
   "/api/update/android",
   async ({ body, request }) => {
      const { version_name } = body;

      const tags = await getAllTags();

      const androidTags = tags
         .filter((x) => x.name.startsWith(releasePrefix))
         .toSorted((a, b) => semver.rcompare(a.name.replace(releasePrefix, ""), b.name.replace(releasePrefix, "")));

      const [latestTag] = androidTags;
      const latestVersion = latestTag?.name.replace(releasePrefix, "");

      // No releases at all
      if (!latestVersion) {
         return { message: "No releases found", version: version_name };
      }

      // Client is already on the latest version
      if (semver.gte(version_name, latestVersion)) {
         return { message: "No update available", version: version_name };
      }

      // Fetch the GitHub release for the latest tag
      const latestRelease = await octokit.rest.repos.getReleaseByTag({
         owner: env.REPO_OWNER,
         repo: env.REPO,
         tag: latestTag.name,
      });

      // Locate the Android bundle (.zip) and its checksum file
      const assets = latestRelease.data.assets;
      const bundleAsset = assets.find((x) => x.name.endsWith(".zip") && x.name.includes("dev.huginn"));
      const checksumAsset = assets.find((x) => x.name === "checksum.txt" || x.name === "bundle.sha256");

      if (!bundleAsset) {
         return {
            message: "Bundle not found for this release",
            version: latestVersion,
         };
      }

      // Fetch the checksum value if a checksum asset exists (this already goes through
      // the server since we read the text and embed it, rather than linking to it)
      let checksum = "";
      if (checksumAsset?.browser_download_url) {
         checksum = (await (await fetch(checksumAsset.browser_download_url)).text()).trim();
      }

      // Point at our own streaming route instead of GitHub's browser_download_url
      const origin = new URL(request.url).origin;
      const downloadUrl = `${origin}/api/update/android/download/${encodeURIComponent(latestTag.name)}/${encodeURIComponent(bundleAsset.name)}`;

      // Return the Capgo-compatible response
      return {
         version: latestVersion,
         url: downloadUrl,
         checksum,
      };
   },
   {
      body: schema,
   },
);

export const getAndroidUpdateAsset = new Elysia().get(
   "/api/update/android/download/:tag/:file",
   async ({ params: { tag, file }, request, status }) => {
      const release = await getReleaseByTag(tag);
      const asset = release.assets.find((x) => x.name === file);

      if (!asset) {
         return status("Not Found");
      }

      // Forward Range in case the updater client (or a CDN in front of your server) uses it
      const range = request.headers.get("range");

      const upstream = await fetch(asset.browser_download_url, {
         headers: range ? { range } : undefined,
      });

      if (!upstream.ok && upstream.status !== 206) {
         return status("Bad Gateway");
      }

      const headers = new Headers();
      headers.set("content-type", "application/zip");
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
   },
   {
      params: t.Object({ tag: t.String(), file: t.String() }),
   },
);
