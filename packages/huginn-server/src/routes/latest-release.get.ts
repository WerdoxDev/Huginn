import { type APIGetLatestReleaseResult } from "@huginnjs/shared";
import Elysia from "elysia";

import { getAllAppReleases, getAppPackageVersion, getWindowsAssetUrl } from "#utils/route-utils";

export const getLatestRelease = new Elysia().get("/api/latest-release", async ({ status }) => {
   const releases = await getAllAppReleases();

   const [latestRelease] = releases;

   const releaseWindowsSetupUrl = getWindowsAssetUrl(latestRelease);

   const json: APIGetLatestReleaseResult = latestRelease && {
      version: getAppPackageVersion(latestRelease.tag_name),
      date: latestRelease.published_at ?? "",
      windowsSetupUrl: releaseWindowsSetupUrl,
      url: latestRelease.url,
      description: latestRelease.body === null ? undefined : latestRelease.body,
   };

   return status("OK", json);
});
