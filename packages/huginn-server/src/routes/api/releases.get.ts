import { octokit, router } from "#server";
import { REPO, REPO_OWNER } from "#setup";
import { type APIGetReleasesResult, HttpCode, type Unpacked } from "@huginn/shared";
import type { Endpoints } from "@octokit/types";
import { defineEventHandler, setResponseStatus } from "h3";

// Release: huginn-0.3.3
// Nightly: huginn-0.3.3-nightly.0

function getWindowsAssetUrl(release?: Unpacked<Endpoints["GET /repos/{owner}/{repo}/releases"]["response"]["data"]>) {
	return release?.assets.find((x) => x.name.endsWith("setup.exe"))?.browser_download_url;
}

router.get(
	"/releases",
	defineEventHandler(async (event) => {
		const releases = (await octokit.rest.repos.listReleases({ owner: REPO_OWNER, repo: REPO })).data;

		const latestRelease = releases.find((x) => !(x.name ?? x.tag_name)?.includes("nightly"));
		const latestNightly = releases.find((x) => (x.name ?? x.tag_name)?.includes("nightly"));

		const releaseWindowsSetupUrl = getWindowsAssetUrl(latestRelease);
		const nightlyWindowsSetupUrl = getWindowsAssetUrl(latestNightly);

		const json: APIGetReleasesResult = {
			release: latestRelease && {
				version: latestRelease.name ?? latestRelease.tag_name,
				date: latestRelease.published_at ?? "",
				windowsSetupUrl: releaseWindowsSetupUrl,
			},
			nightly: latestNightly && {
				version: latestNightly.name ?? latestNightly.tag_name,
				windowsSetupUrl: nightlyWindowsSetupUrl,
				date: latestNightly.published_at ?? "",
			},
		};

		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
