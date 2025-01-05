#! /usr/bin/env bun

import { mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readEnv } from "@huginn/backend-shared";
import type { VersionsObject } from "@huginn/shared";
import { $ } from "bun";
import { defineCommand, runMain, showUsage } from "citty";
import consola from "consola";
import { colors } from "consola/utils";
import { Octokit } from "octokit";
import * as semver from "semver";
import { logger } from "./logger";
import type { PackageType, Suggestions } from "./types";
import {
	directoryExists,
	getBuildFiles,
	getDownloadInfo,
	getPackage,
	getPackageReleases,
	getPackageVersion,
	getReleaseByTag,
	writeCargoTomlVersion,
	writePackageJsonVersion,
} from "./utils";

export const envs = readEnv([
	"APP_PATH",
	"SERVER_PATH",
	"BIFROST_PATH",
	"CDN_PATH",
	"API_PATH",
	"SHARED_PATH",
	"BUNDLER_PATH",
	"BACKEND_SHARED_PATH",
	{ key: "APP_BUILDS_PATH", default: "" },
	{ key: "APP_TAURI_BUILD_PATH", default: "" },
	{ key: "APP_CARGO_TOML_PATH", default: "" },
	{ key: "NSIS_RELATIVE_PATH", default: "/bundle/nsis" },
	"GIST_ID",
	{ key: "REPO_NAME", default: "" },
	"GITHUB_TOKEN",
	"AWS_REGION",
	"AWS_REGION",
	"AWS_KEY_ID",
	"AWS_SECRET_KEY",
	"AWS_BUCKET",
	"AWS_VERSIONS_OBJECT_KEY",
] as const);

export const packages = {
	app: {
		type: "app",
		path: envs.APP_PATH,
		name: "huginn/app",
		buildsPath: envs.APP_BUILDS_PATH,
		tauriBuildPath: envs.APP_TAURI_BUILD_PATH,
		cargoTomlPath: envs.APP_CARGO_TOML_PATH,
	},
	server: {
		type: "server",
		path: envs.SERVER_PATH,
		name: "huginn/server",
	},
	cdn: {
		type: "cdn",
		path: envs.CDN_PATH,
		name: "huginn/cdn",
	},
	bifrost: {
		type: "bifrost",
		path: envs.BIFROST_PATH,
		name: "huginn/bifrost",
	},
	api: {
		type: "api",
		path: envs.API_PATH,
		name: "huginn/api",
	},
	shared: {
		type: "shared",
		path: envs.SHARED_PATH,
		name: "huginn/shared",
	},
	backendShared: {
		type: "backend-shared",
		path: envs.BACKEND_SHARED_PATH,
		name: "huginn/backend-shared",
	},
	bundler: {
		type: "bundler",
		path: envs.BUNDLER_PATH,
		name: "huginn/bundler",
	},
};

export const octokit: Octokit = new Octokit({ auth: envs.GITHUB_TOKEN });
export const s3: S3Client = new S3Client({
	region: envs.AWS_REGION,
	credentials: { accessKeyId: envs.AWS_KEY_ID ?? "", secretAccessKey: envs.AWS_SECRET_KEY ?? "" },
});

const main = defineCommand({
	meta: {
		name: "huginn-bundler",
		version: "1.0.0",
		description: "Very simple bundler for the entire Huginn repository to build & upload versions to github!",
	},
	args: {
		package: {
			type: "string",
			alias: "p",
			required: true,
			description: "The package name to bundler/build/upload/publish/bump...",
		},
		version: {
			type: "string",
			alias: "v",
			required: false,
			description: "A SemVer string for the build or upload or deleting",
			valueHint: "SEMVER",
		},
		suggest: {
			type: "boolean",
			alias: "s",
			description: "Suggests what the next SemVer number should be based on already published versions",
			required: false,
			default: false,
		},
		local: {
			type: "boolean",
			alias: "l",
			description: "Does not publish anything to github. Only for local builds of the app",
		},
		draft: {
			type: "boolean",
			alias: "d",
			description: "Whether or not the GitHub release should be a draft",
			default: false,
			required: false,
		},
		force: {
			type: "boolean",
			alias: "f",
			description: "Force build a version even though it's not recommended by the suggestion",
			required: false,
			default: false,
		},
		delete: {
			type: "boolean",
			description: "Deletes a release from GitHub using the provided version",
			required: false,
		},
	},
	async run({ args }) {
		const packageType = args.package as PackageType;

		if (args.suggest) {
			const suggestions = await getSuggestions(packageType);
			logSuggestions(packageType, suggestions);
			return;
		}

		if (args.version) {
			if (args.delete) {
				await deleteVersion(packageType, args.version);
				return;
			}

			const suggestions = await getSuggestions(packageType);
			const suggestedVersions = [suggestions.nextPatch, suggestions.nextMinor, suggestions.nextMajor];

			if (!suggestedVersions.includes(args.version) && !args.force) {
				logger.versionNotSuggested(args.version);
				return;
			}

			if (packageType === "app") {
				await buildApp(args.version);
			} else {
				await updatePackageJson(packageType, args.version);
			}

			if (args.local) {
				return;
			}

			if (args.draft) {
				const confirmation = await consola.prompt("A draft release cannot later be edited in the cli. Do you want to continue?", {
					type: "confirm",
				});
				if (!confirmation) {
					return;
				}
			}

			await createRelease(packageType, args.version, args.draft);

			if (packageType === "app" && !args.draft) await addToAmazon(args.version);

			return;
		}

		showUsage(main);
	},
});

runMain(main);

async function getSuggestions(packageType: PackageType): Promise<Suggestions> {
	const releases = await getPackageReleases(packageType);

	let localLatest: string | undefined;
	if (packageType === "app") {
		const localBuilds = (await readdir(envs.APP_BUILDS_PATH))
			.map((x) => semver.valid(x))
			.filter((x) => x !== null)
			.sort(semver.rcompare);

		localLatest = localBuilds[0];
	} else {
		localLatest = await getPackageVersion(packageType);
	}

	const [latest] = releases;

	const nextPatch = semver.inc(localLatest ?? "", "patch");
	const nextMinor = semver.inc(localLatest ?? "", "minor");
	const nextMajor = semver.inc(localLatest ?? "", "major");

	return {
		latest: latest?.name,
		localLatest,
		nextPatch,
		nextMinor,
		nextMajor,
	};
}

function logSuggestions(packageType: PackageType, suggestions: Suggestions) {
	consola.log(`${colors.gray(packageType)} ${colors.gray("->")} ${colors.magenta(colors.bold("Next"))}`);
	consola.log(`  ${colors.green(colors.bold("shame"))}: ${colors.green(suggestions.nextPatch ?? "none")}`);
	consola.log(`  ${colors.green(colors.bold("default"))}: ${colors.green(suggestions.nextMinor ?? "none")}`);
	consola.log(`  ${colors.green(colors.bold("proud"))}: ${colors.green(suggestions.nextMajor ?? "none")}`);
	consola.log("");

	consola.log(`${colors.gray(packageType)} ${colors.gray("->")} ${colors.yellow(colors.bold("Current"))}`);
	consola.log(`  ${colors.blue("local")}: ${colors.cyan(suggestions.localLatest ?? "none")}`);
	consola.log(`  ${colors.blue("GitHub")}: ${colors.cyan(suggestions.latest ?? "none")}`);
}

async function buildApp(version: string): Promise<void> {
	try {
		const versionDir = path.join(envs.APP_BUILDS_PATH, version);
		const buildPath = path.join(envs.APP_TAURI_BUILD_PATH, envs.NSIS_RELATIVE_PATH);

		if (await directoryExists(versionDir)) {
			logger.versionExists(version);
			return;
		}

		// Update the version number in cargo.toml
		await writeCargoTomlVersion(envs.APP_CARGO_TOML_PATH, version);

		logger.cargoVersionUpdated(version);

		logger.buildingApp(version);

		let files = await getBuildFiles(buildPath, version);

		if (files) {
			logger.buildExists(version);
		} else {
			// Set environment variables for tauri
			$.env({
				...process.env,
				TAURI_SIGNING_PRIVATE_KEY: process.env.TAURI_PRIVATE_KEY,
				TAURI_SIGNING_PRIVATE_KEY_PASSWORD: process.env.TAURI_KEY_PASSWORD,
			});

			// Run the build script and log the result
			await $`cd ${envs.APP_PATH} && bun tauri-build`.quiet();
		}

		logger.copyingBuildFiles(versionDir);

		// Create a directory for the new version
		await mkdir(versionDir);

		files = await getBuildFiles(buildPath, version, true);

		// Get blob for setup.exe, .exe and .sig files
		const sigFile = Bun.file(files.nsisSigFile.path);
		const setupFile = Bun.file(files.nsisSetupFile.path);
		const exeFile = Bun.file(path.join(envs.APP_TAURI_BUILD_PATH, "huginn.exe"));

		// Copy setup.exe, .exe and .sig files to our new version's folder
		await Bun.write(path.join(versionDir, files.nsisSigFile.name), sigFile);
		await Bun.write(path.join(versionDir, files.nsisSetupFile.name), setupFile);
		await Bun.write(path.join(versionDir, `Huginn_${version}.exe`), exeFile);

		logger.buildCompleted(version);
	} catch (e) {
		consola.error("Something went wrong... ");
		throw e;
	}
}

async function updatePackageJson(packageType: PackageType, version: string) {
	const thisPackage = getPackage(packageType);
	await writePackageJsonVersion(path.join(thisPackage.path, "package.json"), version);
	logger.packageVersionUpdated(packageType, version);
}

async function createRelease(packageType: PackageType, version: string, draft: boolean) {
	const thisPackage = getPackage(packageType);
	const owner = "WerdoxDev";

	// Create the release with a description
	const newTagName = `${thisPackage.name}-v${version}`;

	let release = await getReleaseByTag(newTagName, owner, envs.REPO_NAME);
	const releaseExists = !!release;

	const [latestRelease] = await getPackageReleases(packageType);

	if (release) {
		logger.releaseExists(version);
	} else {
		logger.creatingRelease(packageType, version, draft);

		// Fetch commits between the previous and new tags
		const commits = await octokit.rest.repos.compareCommitsWithBasehead({
			owner,
			repo: envs.REPO_NAME,
			basehead: `${latestRelease ? latestRelease.tag_name : "dev"}...dev`,
		});

		// Extract commit messages
		const commitMessages = commits.data.commits.map((commit) => `- ${commit.commit.message} ${commit.sha}`).join("\n");

		release = await octokit.rest.repos.createRelease({
			owner,
			repo: envs.REPO_NAME,
			name: `${thisPackage.name} v${version}`,
			tag_name: newTagName,
			target_commitish: "dev",
			body: `### Commits:\n${commitMessages}`,
			draft,
		});
	}

	if (packageType === "app") {
		// Get build files from debug or release folders
		const files = await getBuildFiles(path.join(envs.APP_BUILDS_PATH, version), version, true);

		// Convert build files to strings
		const sigFileString = await Bun.file(files.nsisSigFile.path).text();
		const setupFileString = await Bun.file(files.nsisSetupFile.path).arrayBuffer();

		const releaseAssets = await octokit.rest.repos.listReleaseAssets({ release_id: release.data.id, owner, repo: envs.REPO_NAME });

		if (releaseAssets.data.length > 0) {
			logger.deletingExistingAssets(version);

			for (const asset of releaseAssets.data) {
				await octokit.rest.repos.deleteReleaseAsset({ asset_id: asset.id, owner, repo: envs.REPO_NAME });
			}
		}

		logger.uploadingReleaseFiles();

		// Upload .exe and .sig and files to the release
		await octokit.rest.repos.uploadReleaseAsset({
			name: files.nsisSigFile.name,
			release_id: release.data.id,
			owner,
			repo: envs.REPO_NAME,
			data: sigFileString,
		});

		await octokit.rest.repos.uploadReleaseAsset({
			name: files.nsisSetupFile.name,
			release_id: release.data.id,
			owner,
			repo: envs.REPO_NAME,
			data: setupFileString as unknown as string,
		});
	}

	if (releaseExists) {
		logger.releaseUpdated(version);
	} else {
		logger.releaseCreated(packageType, version, draft);
	}

	logger.releaseLink(release.data.html_url);
}

async function addToAmazon(version: string) {
	const thisPackage = getPackage("app");
	const release = await getReleaseByTag(`${thisPackage.name}-v${version}`, "WerdoxDev", envs.REPO_NAME);

	if (!release) {
		logger.releaseDoesNotExist("app", version);
		return;
	}

	const publishDate = release?.data.published_at ?? "";
	const description = release?.data.body ?? "";

	const windowsDownloadInfo = await getDownloadInfo(release, "setup.exe", "setup.exe.sig");

	let versions: VersionsObject = {};
	try {
		const getCommand = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: envs.AWS_VERSIONS_OBJECT_KEY });
		versions = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");
	} catch {
		logger.creatingAmazonObject();
	}

	if (version in versions) {
		logger.amazonExists(version);

		versions[version].description = description;
		versions[version].downloads = { windows: windowsDownloadInfo };
	} else {
		logger.updatingAmazonObject(version);

		versions[version] = { description, publishDate, downloads: { windows: windowsDownloadInfo } };
	}

	const putCommand = new PutObjectCommand({
		Bucket: envs.AWS_BUCKET,
		Key: envs.AWS_VERSIONS_OBJECT_KEY,
		ACL: "public-read",
		Body: JSON.stringify(versions),
		ContentType: "application/json",
	});
	await s3.send(putCommand);

	logger.amazonObjectUpdated(version);
}

async function deleteVersion(packageType: PackageType, version: string) {
	const owner = "WerdoxDev";
	const versionDir = path.join(envs.APP_BUILDS_PATH, version);
	const thisPackage = getPackage(packageType);

	if (packageType === "app") {
		if (await directoryExists(versionDir)) {
			await rm(path.join(envs.APP_BUILDS_PATH, version), {
				force: true,
				recursive: true,
			});

			logger.versionDeleted(version);
		} else {
			logger.versionDoesNotExist(version);
		}
	}

	const release = await getReleaseByTag(`${thisPackage.name}-v${version}`, owner, envs.REPO_NAME);

	if (release) {
		await octokit.rest.repos.deleteRelease({ owner, release_id: release.data.id, repo: envs.REPO_NAME });
		await octokit.rest.git.deleteRef({ owner, repo: envs.REPO_NAME, ref: `tags/${thisPackage.name}-v${version}` });

		logger.releaseDeleted(packageType, version);
	} else {
		logger.releaseDoesNotExist("app", version);
	}

	if (packageType === "app") {
		try {
			const getCommand = new GetObjectCommand({ Bucket: envs.AWS_BUCKET, Key: envs.AWS_VERSIONS_OBJECT_KEY });
			const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");

			if (!(version in versions)) {
				logger.amazonDoesNotExist(version);
				return;
			}

			delete versions[version];

			const putCommand = new PutObjectCommand({
				Bucket: envs.AWS_BUCKET,
				Key: envs.AWS_VERSIONS_OBJECT_KEY,
				ACL: "public-read",
				Body: JSON.stringify(versions),
				ContentType: "application/json",
			});

			await s3.send(putCommand);
			logger.amazonDeleted(version);
		} catch {
			logger.amazonDoesNotExist(version);
		}
	}
}
