import { GetObjectCommand } from "@aws-sdk/client-s3";
import { type APICheckUpdateResult, HttpCode, type VersionsObject } from "@huginn/shared";
import { defineEventHandler, sendNoContent, setResponseStatus } from "h3";
import * as semver from "semver";
import { router, s3 } from "#server";
import { envs } from "#setup";

type TargetKind = "none" | "windows";

router.get(
	"/check-update/:target/:currentVersion",
	defineEventHandler(async (event) => {
		// windows
		const target = (event.context.params?.target ?? "none") as TargetKind;
		const currentVersion = event.context.params?.currentVersion ?? "";

		if (target === "none") {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		const getCommand = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: envs.AWS_VERSIONS_OBJECT_KEY });
		const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");

		const sortedVersions = Object.keys(versions).sort(semver.rcompare);

		const [latest] = sortedVersions;

		// We don't have a version
		if (!latest) {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		// Already on the latest version
		if (target === "windows" && currentVersion === latest) {
			return sendNoContent(event, HttpCode.NO_CONTENT);
		}

		// Send newest version
		if (target === "windows" && latest) {
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
	}),
);
