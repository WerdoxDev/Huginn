import Elysia, { t } from "elysia";
import * as semver from "semver";

import { octokit } from "#setup";
import { envs } from "#setup";
import { getAllTags } from "#utils/route-utils";

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
   async ({ body, status }) => {
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
         owner: envs.REPO_OWNER,
         repo: envs.REPO,
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

      // Fetch the checksum value if a checksum asset exists
      let checksum = "";
      if (checksumAsset?.browser_download_url) {
         checksum = (await (await fetch(checksumAsset.browser_download_url)).text()).trim();
      }

      // Return the Capgo-compatible response
      return {
         version: latestVersion,
         url: bundleAsset.browser_download_url,
         checksum,
      };
   },
   {
      body: schema,
      afterResponse: ({ responseValue }) => {
         console.log("Response value:", responseValue);
      },
   },
);
