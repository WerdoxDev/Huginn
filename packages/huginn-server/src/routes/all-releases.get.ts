import { type APIGetAllReleasesResult } from "@huginn/shared";
import { getAllAppReleases, getAppPackageVersion, getWindowsAssetUrl } from "#utils/route-utils";
import Elysia from "elysia";

export const getAllReleases = new Elysia().get("/api/all-releases", async ({ status }) => {
   const releases = await getAllAppReleases();

   const json: APIGetAllReleasesResult = releases.map((release) => {
      return {
         version: getAppPackageVersion(release.tag_name),
         date: release.published_at ?? "",
         windowsSetupUrl: getWindowsAssetUrl(release),
         url: release.url,
         description: release.body === null ? undefined : release.body,
      };
   });

   return status("OK", json);
});
