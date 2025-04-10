import { createRoute } from "@huginn/backend-shared";
import { type APICheckUpdateResult, HttpCode } from "@huginn/shared";
import * as semver from "semver";
import { octokit } from "#setup";
import { envs } from "#setup";
import { getAllTags } from "#utils/route-utils";

type TargetKind = "none" | "win";

createRoute("GET", "/api/update/:target/:file", async (c) => {
	// windows
	const target = c.req.param("target") as TargetKind;
	const file = c.req.param("file");

	if (target === "none") {
		return c.newResponse(null, HttpCode.NO_CONTENT);
	}

	const tags = await getAllTags();

	if (file !== "latest.yml") {
		const version = file.match(/_([\d.]+)_/)?.[1];
		const tag = `app@v${version}`;
		const release = await octokit.rest.repos.getReleaseByTag({ owner: envs.REPO_OWNER, repo: envs.REPO, tag });

		const asset = release.data.assets.find((x) => x.name === file);
		return c.redirect(asset?.browser_download_url ?? "");
	}

	const [latestTag] = tags
		.filter((x) => x.name.startsWith("app@v"))
		.toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

	const latestVersion = latestTag.name.replace("app@v", "");
	const latestRelease = await octokit.rest.repos.getReleaseByTag({ owner: envs.REPO_OWNER, repo: envs.REPO, tag: latestTag.name });

	const latestInfo = await (await fetch(latestRelease.data.assets.find((x) => x.name === "latest.yml")?.browser_download_url ?? "")).arrayBuffer();

	// We don't have a version
	if (!latestVersion) {
		return c.newResponse(null, HttpCode.NO_CONTENT);
	}

	// Send newest version
	if (target === "win" && latestVersion) {
		return c.body(latestInfo, HttpCode.OK, { "Content-Type": "text/yaml" });
	}
});
