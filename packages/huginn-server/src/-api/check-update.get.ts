import { type APICheckUpdateResult, HttpCode } from "@huginn/shared";
import { defineEventHandler, sendNoContent, setResponseStatus } from "h3";
import * as semver from "semver";
import { octokit, router } from "#server";
import { envs } from "#setup";

type TargetKind = "none" | "windows-x86_64";

router.get(
	"/check-update/:target/:currentVersion",
	defineEventHandler(async (event) => {
		// windows
		const target = (event.context.params?.target ?? "none") as TargetKind;
		const currentVersion = event.context.params?.currentVersion ?? "";

		if (target === "none") {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		// const getCommand = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: envs.AWS_VERSIONS_OBJECT_KEY });
		// const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");
		const tags = await octokit.request("GET /repos/{owner}/{repo}/tags", { owner: envs.REPO_OWNER, repo: envs.REPO, per_page: 100 });
		const [latestTag] = tags.data
			.filter((x) => x.name.startsWith("app@v"))
			.toSorted((a, b) => semver.rcompare(a.name.replace("app@", ""), b.name.replace("app@", "")));

		const latestVersion = latestTag.name.replace("app@v", "");
		const latestRelease = await octokit.rest.repos.getReleaseByTag({ owner: envs.REPO_OWNER, repo: envs.REPO, tag: latestTag.name });
		const latestInfo = await (await fetch(latestRelease.data.assets.find((x) => x.name === "latest.json")?.browser_download_url ?? "")).json();

		// const sortedVersions = Object.keys(versions).sort(semver.rcompare);

		// const [latest] = sortedVersions;

		// We don't have a version
		if (!latestVersion) {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		// Already on the latest version
		if (target.includes("windows") && currentVersion === latestVersion) {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		// Send newest version
		if (target.includes("windows") && latestVersion) {
			const platform = latestInfo.platforms["windows-x86_64"];

			setResponseStatus(event, HttpCode.OK);
			return {
				version: latestVersion,
				notes: latestInfo.notes,
				pub_date: latestInfo.pub_date,
				signature: platform.signature,
				url: platform.url,
			} as APICheckUpdateResult;
		}
	}),
);
