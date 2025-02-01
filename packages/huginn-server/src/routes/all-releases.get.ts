import { createRoute } from "@huginn/backend-shared";
import { type APIGetAllReleasesResult, HttpCode } from "@huginn/shared";
import { getAllAppReleases, getAppPackageVersion, getWindowsAssetUrl } from "#utils/route-utils";

createRoute("GET", "/api/all-releases", async (c) => {
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

	return c.json(json, HttpCode.OK);
});
