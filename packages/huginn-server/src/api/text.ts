import { type APIGetAllReleasesResult, HttpCode } from "@huginn/shared";
// import { defineEventHandler, setResponseStatus } from "h3";
import * as semver from "semver";
import { octokit, router } from "#server";
import { envs } from "#setup";
import { getAllAppReleases, getAppPackageVersion, getWindowsAssetUrl } from "#utils/route-utils";

export default 	defineEventHandler(async (event) => {
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

		setResponseStatus(event, HttpCode.OK);
		return json;
});

