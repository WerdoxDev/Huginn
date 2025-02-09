import { createRoute } from "@huginn/backend-shared";
import { type APICheckUpdateResult, HttpCode } from "@huginn/shared";
import * as semver from "semver";
import { octokit } from "#setup";
import { envs } from "#setup";
import { getAllTags } from "#utils/route-utils";

type TargetKind = "none" | "windows-x86_64";

createRoute("GET", "/api/check-update/:target/:currentVersion", async (c) => {
	// windows
	const target = c.req.param("target") as TargetKind;
	const currentVersion = c.req.param("currentVersion");

	if (target === "none") {
		return c.newResponse(null, HttpCode.NO_CONTENT);
	}

	// const getCommand = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: envs.AWS_VERSIONS_OBJECT_KEY });
	// const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");
	const tags = await getAllTags();
	const [latestTag] = tags
		.filter((x) => x.name.startsWith("app@v"))
		.toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

	console.log(tags.length);

	const latestVersion = latestTag.name.replace("app@v", "");
	const latestRelease = await octokit.rest.repos.getReleaseByTag({ owner: envs.REPO_OWNER, repo: envs.REPO, tag: latestTag.name });
	const latestInfo = await (await fetch(latestRelease.data.assets.find((x) => x.name === "latest.json")?.browser_download_url ?? "")).json();

	// const sortedVersions = Object.keys(versions).sort(semver.rcompare);

	// const [latest] = sortedVersions;

	// We don't have a version
	if (!latestVersion) {
		return c.newResponse(null, HttpCode.NO_CONTENT);
	}

	// Already on the latest version
	if (target.includes("windows") && currentVersion === latestVersion) {
		return c.newResponse(null, HttpCode.NO_CONTENT);
	}

	// Send newest version
	if (target.includes("windows") && latestVersion) {
		const platform = latestInfo.platforms["windows-x86_64"];

		const json: APICheckUpdateResult = {
			version: latestVersion,
			notes: latestInfo.notes,
			pub_date: latestInfo.pub_date,
			signature: platform.signature,
			url: platform.url,
		};
		return c.json(json, HttpCode.OK);
	}
});
