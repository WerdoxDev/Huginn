import { type APIGetLatestReleaseResult, HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { router } from "#server";
import { getAllAppReleases, getAppPackageVersion, getWindowsAssetUrl } from "#utils/route-utils";

router.get(
	"/latest-release",
	defineEventHandler(async (event) => {
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

		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
