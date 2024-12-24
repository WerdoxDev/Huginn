import { type APIGetLatestReleasesResult, HttpCode, type Unpacked } from "@huginn/shared";
import type { Endpoints } from "@octokit/types";
import { defineEventHandler, setResponseStatus } from "h3";
import * as semver from "semver";
import { octokit, router } from "#server";
import { envs } from "#setup";
import { getWindowsAssetUrl } from "#utils/route-utils";

// Release: huginn-0.3.3
// Nightly: huginn-0.3.3-nightly.0

router.get(
	"/latest-releases",
	defineEventHandler(async (event) => {
		const releases = (await octokit.rest.repos.listReleases({ owner: envs.REPO_OWNER, repo: envs.REPO })).data.sort((v1, v2) =>
			semver.rcompare(v1.name ?? v1.tag_name, v2.name ?? v2.tag_name),
		);

		const latestRelease = releases.find((x) => !(x.name ?? x.tag_name)?.includes("nightly"));
		const latestNightly = releases.find((x) => (x.name ?? x.tag_name)?.includes("nightly"));

		const releaseWindowsSetupUrl = getWindowsAssetUrl(latestRelease);
		const nightlyWindowsSetupUrl = getWindowsAssetUrl(latestNightly);

		const json: APIGetLatestReleasesResult = {
			release: latestRelease && {
				version: latestRelease.name ?? latestRelease.tag_name,
				date: latestRelease.published_at ?? "",
				windowsSetupUrl: releaseWindowsSetupUrl,
				url: latestRelease.url,
			},
			nightly: latestNightly && {
				version: latestNightly.name ?? latestNightly.tag_name,
				windowsSetupUrl: nightlyWindowsSetupUrl,
				date: latestNightly.published_at ?? "",
				url: latestNightly.url,
			},
		};

		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
