import { type APIGetAllReleasesResult, type APIGetLatestReleasesResult, HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import * as semver from "semver";
import { octokit, router } from "#server";
import { envs } from "#setup";
import { getWindowsAssetUrl } from "#utils/route-utils";

router.get(
	"/all-releases",
	defineEventHandler(async (event) => {
		const releases = (await octokit.rest.repos.listReleases({ owner: envs.REPO_OWNER, repo: envs.REPO })).data.sort((v1, v2) =>
			semver.rcompare(v1.name ?? v1.tag_name, v2.name ?? v2.tag_name),
		);

		const json: APIGetAllReleasesResult = releases.map((release) => {
			return {
				version: release.name ?? release.tag_name,
				date: release.published_at ?? "",
				windowsSetupUrl: getWindowsAssetUrl(release),
				url: release.url,
			};
		});

		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
