import { type APIGetLatestReleaseResult, HttpCode } from "@huginn/shared";

import { createRoute } from "@huginn/backend-shared";
import { getAllAppReleases, getAppPackageVersion, getWindowsAssetUrl } from "#utils/route-utils";

createRoute("GET", "/api/latest-release", async (c) => {
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

	return c.json(json, HttpCode.OK);
});
