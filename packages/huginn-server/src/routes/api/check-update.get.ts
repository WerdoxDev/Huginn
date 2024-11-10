import { GetObjectCommand } from "@aws-sdk/client-s3";
import { type APICheckUpdateResult, HttpCode, type VersionsObject } from "@huginn/shared";
import { defineEventHandler, sendNoContent, setResponseStatus } from "h3";
import * as semver from "semver";
import { router, s3 } from "#server";
import { envs } from "#setup";

type TargetKind = "none" | "windows-release" | "windows-nightly";

router.get(
	"/check-update/:target/:currentVersion",
	defineEventHandler(async (event) => {
		// windows-latest, windows-nightly
		const target = (event.context.params?.target ?? "none") as TargetKind;
		const currentVersion = event.context.params?.currentVersion ?? "";

		if (target === "none") {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		const getCommand = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: envs.AWS_VERSIONS_OBJECT_KEY });
		const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");

		const sortedVersions = Object.keys(versions).sort(semver.rcompare);

		const latest = sortedVersions.find((x) => !semver.prerelease(x));
		const latestNightly = sortedVersions.find((x) => semver.prerelease(x)?.[0]);

		if ((target === "windows-release" && !latest) || (target === "windows-nightly" && !latestNightly)) {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		if ((target === "windows-release" && currentVersion === latest) || (target === "windows-nightly" && currentVersion === latestNightly)) {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		if (target === "windows-release" && latest) {
			const version = versions[latest];

			setResponseStatus(event, HttpCode.OK);
			return {
				version: latest,
				notes: version.description,
				pub_date: version.publishDate,
				signature: version.downloads.windows?.signature,
				url: version.downloads.windows?.url,
			} as APICheckUpdateResult;
		}
		if (target === "windows-nightly" && latestNightly) {
			const version = versions[latestNightly];

			setResponseStatus(event, HttpCode.OK);
			return {
				version: latestNightly,
				notes: version.description,
				pub_date: version.publishDate,
				signature: version.downloads.windows?.signature,
				url: version.downloads.windows?.url,
			} as APICheckUpdateResult;
		}
	}),
);
