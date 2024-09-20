#! /usr/bin/env bun
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { VersionsObject } from "@huginn/shared";
import { $ } from "bun";
import { defineCommand, runMain, showUsage } from "citty";
import consola from "consola";
import { colors } from "consola/utils";
import { mkdir, readdir, rm } from "node:fs/promises";
import { Octokit } from "octokit";
import path from "path";
import * as semver from "semver";
import { logger } from "./logger";
import { Suggestions } from "./types";
import { directoryExists, getBuildFiles, getBuildFlavour, getDownloadInfo, getReleaseByTag, writeCargoTomlVersion } from "./utils";

export const APP_PATH: string = process.env.APP_PATH!;
export const BUILDS_PATH: string = process.env.BUILDS_PATH!;

export const TAURI_BUILD_PATH: string = process.env.TAURI_BUILD_PATH!;

export const NSIS_RELATIVE_PATH = "/bundle/nsis";

export const CARGO_TOML_PATH: string = process.env.CARGO_TOML_PATH!;

export const GIST_ID: string = process.env.GIST_ID!;
export const REPO: string = process.env.REPO_NAME!;
export const GITHUB_TOKEN: string = process.env.GITHUB_TOKEN!;

export const AWS_REGION: string = process.env.AWS_REGION!;
export const AWS_KEY_ID: string = process.env.AWS_KEY_ID!;
export const AWS_SECRET_KEY: string = process.env.AWS_SECRET_KEY!;
export const AWS_BUCKET: string = process.env.AWS_BUCKET!;
export const AWS_VERSIONS_OBJECT_KEY: string = process.env.AWS_VERSIONS_OBJECT_KEY!;

export const octokit: Octokit = new Octokit({ auth: GITHUB_TOKEN });
export const s3: S3Client = new S3Client({
   region: AWS_REGION,
   credentials: { accessKeyId: AWS_KEY_ID, secretAccessKey: AWS_SECRET_KEY },
});

const main = defineCommand({
   meta: {
      name: "huginn-bundler",
      version: "0.1.0",
      description: "Very simple bundler that builds the Huginn App and uploads it to github!",
   },
   args: {
      version: {
         type: "string",
         alias: "v",
         required: false,
         description: "A SemVer string for the build or upload or deleting",
         valueHint: "SEMVER",
      },
      skip: {
         type: "boolean",
         description: "Skips prompting for a description. Useful for nightly builds.",
         default: false,
         required: false,
      },
      deleteLocal: {
         type: "boolean",
         alias: "l",
         description: "Deletes the provided SemVer version from local",
         required: false,
         default: false,
      },
      deleteGithub: {
         type: "boolean",
         alias: "g",
         description: "Deletes the provided SemVer from GitHub",
         valueHint: "SEMVER",
         required: false,
         default: false,
      },
      deleteAmazon: {
         type: "boolean",
         alias: "x",
         description: "Deletes the provided SemVer from AWS S3 bucket",
         valueHint: "SEMVER",
         required: false,
         default: false,
      },
      upload: {
         type: "boolean",
         alias: "u",
         description: "Uploads the build to GitHub as a release. If build already exists, it skips building it again",
         required: false,
         default: false,
      },
      amazon: {
         type: "boolean",
         alias: "a",
         description:
            "Adds the version to the AWS S3 bucket. If it exists, it gets updated. This won't work without uploading to GitHub",
         required: false,
         default: false,
      },
      draft: {
         type: "boolean",
         alias: "d",
         description: "Whether or not the GitHub release should be a draft",
         default: false,
         required: false,
      },
      suggest: {
         type: "boolean",
         alias: "s",
         description: "Suggests what the next SemVer number should be based on already published versions",
         required: false,
         default: false,
      },
      force: {
         type: "boolean",
         alias: "f",
         description: "Force build a version even though it's not recommended by the suggestion",
         required: false,
         default: false,
      },
   },
   async run({ args }) {
      if (args.suggest) {
         const suggestions = await getSuggestions();
         logSuggestions(suggestions);
         return;
      }

      if (args.version) {
         if (args.deleteLocal || args.deleteGithub || args.deleteAmazon) {
            await deleteVersion(args.version, args.deleteLocal, args.deleteGithub, args.deleteAmazon);
            return;
         }

         const result = await build(args.version, args.force);

         if ((args.upload || args.amazon) && result) {
            if (args.draft && args.upload) {
               const confirmation = await consola.prompt(
                  "A draft release cannot later be edited in the cli. Do you want to continue?",
                  {
                     type: "confirm",
                  },
               );
               if (!confirmation) {
                  return;
               }
            }

            if (args.upload) {
               const description = args.skip ? "" : await consola.prompt("Enter a description:", { type: "text" });
               await createRelease(args.version, description, args.draft);
            }
            if (args.amazon) {
               await addToAmazon(args.version);
            }
            return;
         }

         return;
      }

      showUsage(main);
   },
});

runMain(main);

async function getSuggestions(): Promise<Suggestions> {
   const releases = await octokit.rest.repos.listReleases({ owner: "WerdoxDev", repo: REPO });
   const localBuilds = (await readdir(BUILDS_PATH))
      .map(x => semver.valid(x))
      .filter(x => x !== null)
      .sort(semver.rcompare);

   const latest = releases.data.find(x => !x.prerelease);
   const latestNightly = releases.data.find(x => x.prerelease);

   const localLatest = localBuilds.find(x => !semver.prerelease(x));
   const localLatestNightly = localBuilds.find(x => semver.prerelease(x)?.[0]);

   const nextPatch = semver.inc(localLatest ?? "", "patch");
   const nextMinor = semver.inc(localLatest ?? "", "minor");
   const nextMajor = semver.inc(localLatest ?? "", "major");
   const nextNightly =
      localLatest &&
      semver.inc(
         localLatestNightly
            ? semver.compare(localLatest, localLatestNightly) === 1
               ? localLatest
               : (localLatestNightly ?? "")
            : localLatest,
         "prerelease",
         "nightly",
      );

   return {
      latest: latest?.name,
      latestNightly: latestNightly?.name,
      localLatest,
      localLatestNightly,
      nextPatch,
      nextMinor,
      nextMajor,
      nextNightly,
   };
}

function logSuggestions(suggestions: Suggestions) {
   consola.log("");
   consola.log(`${colors.gray("---")} ${colors.magenta("Next version suggestions")}`);
   consola.log(`  ${colors.gray("--")} ${colors.green(colors.bold("nightly"))}: ${colors.green(suggestions.nextNightly ?? "none")}`);
   consola.log(`  ${colors.gray("--")} ${colors.green(colors.bold("patch"))}: ${colors.green(suggestions.nextPatch ?? "none")}`);
   consola.log(`  ${colors.gray("--")} ${colors.green(colors.bold("minor"))}: ${colors.green(suggestions.nextMinor ?? "none")}`);
   consola.log(`  ${colors.gray("--")} ${colors.green(colors.bold("major"))}: ${colors.green(suggestions.nextMajor ?? "none")}`);
   consola.log("");

   consola.log(`${colors.gray("---")} ${colors.yellow("Current versions")}`);
   consola.log(`  ${colors.gray("--")} ${colors.blue("local")}: ${colors.cyan(suggestions.localLatest ?? "none")}`);
   consola.log(
      `  ${colors.gray("--")} ${colors.blue("local")} ${colors.red("nightly")}: ${colors.cyan(suggestions.localLatestNightly ?? "none")}`,
   );
   consola.log(`  ${colors.gray("--")} ${colors.blue("GitHub")}: ${colors.cyan(suggestions.latest ?? "none")}`);
   consola.log(
      `  ${colors.gray("--")} ${colors.blue("GitHub")} ${colors.red("nightly")}: ${colors.cyan(suggestions.latestNightly ?? "none")}`,
   );
}

async function build(version: string, force?: boolean): Promise<boolean> {
   try {
      const versionDir = path.join(BUILDS_PATH, version);
      const buildPath = path.join(TAURI_BUILD_PATH, NSIS_RELATIVE_PATH);

      if (await directoryExists(versionDir)) {
         logger.versionExists(version);
         return true;
      }

      const suggestions = await getSuggestions();
      const suggestedVersions = [suggestions.nextNightly, suggestions.nextPatch, suggestions.nextMinor, suggestions.nextMajor];

      if (!suggestedVersions.includes(version) && !force) {
         logger.versionNotSuggested(version);
         return false;
      }

      const flavour = getBuildFlavour(version);

      // Update the version number in cargo.toml
      await writeCargoTomlVersion(CARGO_TOML_PATH, version);

      logger.versionFieldsUpdated(version);

      logger.buildingApp(version, flavour);

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
         await $`cd ${APP_PATH} && bun tauri-build`.quiet();
      }

      logger.copyingBuildFiles(versionDir);

      // Create a directory for the new version
      await mkdir(versionDir);

      files = await getBuildFiles(buildPath, version, true);

      // Get blob for setup.exe, .exe and .sig files
      const sigFile = Bun.file(files.nsisSigFile.path);
      const setupFile = Bun.file(files.nsisSetupFile.path);
      const exeFile = Bun.file(path.join(TAURI_BUILD_PATH, "huginn.exe"));

      // Copy setup.exe, .exe and .sig files to our new version's folder
      await Bun.write(path.join(versionDir, files.nsisSigFile.name), sigFile);
      await Bun.write(path.join(versionDir, files.nsisSetupFile.name), setupFile);
      await Bun.write(path.join(versionDir, `Huginn_${version}.exe`), exeFile);

      logger.buildCompleted(version, flavour);

      return true;
   } catch (e) {
      consola.error("Something went wrong... ");
      throw e;
   }
}

async function createRelease(version: string, description: string, draft: boolean) {
   const flavour = getBuildFlavour(version);
   const owner = "WerdoxDev";

   // Create the release with a description
   const releaseName = `v${version}`;

   let release = await getReleaseByTag(releaseName, owner, REPO);
   const releaseExists = !!release;

   if (release) {
      logger.releaseExists(version);

      await octokit.rest.repos.updateRelease({
         release_id: release.data.id,
         owner,
         repo: REPO,
         body: description ? description : undefined,
         name: releaseName,
         tag_name: releaseName,
         target_commitish: "master",
         draft,
      });
   } else {
      logger.creatingRelease(version, flavour, draft);

      release = await octokit.rest.repos.createRelease({
         owner,
         repo: REPO,
         name: releaseName,
         tag_name: releaseName,
         target_commitish: "master",
         body: description,
         prerelease: flavour === "nightly",
         draft,
         generate_release_notes: flavour === "nightly",
      });
   }

   // Get build files from debug or release folders
   const files = await getBuildFiles(path.join(BUILDS_PATH, version), version, true);

   // Convert build files to strings
   const sigFileString = await Bun.file(files.nsisSigFile.path).text();
   const setupFileString = await Bun.file(files.nsisSetupFile.path).arrayBuffer();

   const releaseAssets = await octokit.rest.repos.listReleaseAssets({ release_id: release.data.id, owner, repo: REPO });

   if (releaseAssets.data.length > 0) {
      logger.deletingExistingAssets(version);

      for (const asset of releaseAssets.data) {
         await octokit.rest.repos.deleteReleaseAsset({ asset_id: asset.id, owner, repo: REPO });
      }
   }

   logger.uploadingReleaseFiles();

   // Upload .exe and .sig and files to the release
   await octokit.rest.repos.uploadReleaseAsset({
      name: files.nsisSigFile.name,
      release_id: release.data.id,
      owner,
      repo: REPO,
      data: sigFileString,
   });

   await octokit.rest.repos.uploadReleaseAsset({
      name: files.nsisSetupFile.name,
      release_id: release.data.id,
      owner,
      repo: REPO,
      data: setupFileString as unknown as string,
   });

   if (releaseExists) {
      logger.releaseUpdated(version, flavour);
   } else {
      logger.releaseCreated(version, flavour, draft);
   }

   logger.releaseLink(release.data.html_url);
}

async function addToAmazon(version: string) {
   const flavour = getBuildFlavour(version);

   const release = await getReleaseByTag("v" + version, "WerdoxDev", REPO);

   if (!release) {
      logger.releaseDoesNotExist(version);
      return;
   }

   const publishDate = release?.data.published_at ?? "";
   const description = release?.data.body ?? "";

   const windowsDownloadInfo = await getDownloadInfo(release, "setup.exe", "setup.exe.sig");

   let versions: VersionsObject = {};
   try {
      const getCommand = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: AWS_VERSIONS_OBJECT_KEY });
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

      versions[version] = { description, publishDate, flavour, downloads: { windows: windowsDownloadInfo } };
   }

   const putCommand = new PutObjectCommand({
      Bucket: AWS_BUCKET,
      Key: AWS_VERSIONS_OBJECT_KEY,
      ACL: "public-read",
      Body: JSON.stringify(versions),
      ContentType: "application/json",
   });
   await s3.send(putCommand);

   logger.amazonObjectUpdated(version);
}

async function deleteVersion(version: string, deleteLocal: boolean, deleteGitHub: boolean, deleteAmazon: boolean) {
   const owner = "WerdoxDev";
   const versionDir = path.join(BUILDS_PATH, version);

   if (deleteLocal) {
      if (await directoryExists(versionDir)) {
         await rm(path.join(BUILDS_PATH, version), {
            force: true,
            recursive: true,
         });

         logger.versionDeleted(version);
      } else {
         logger.versionDoesNotExist(version);
      }
   }

   if (deleteGitHub) {
      const release = await getReleaseByTag(`v${version}`, owner, REPO);

      if (release) {
         await octokit.rest.repos.deleteRelease({ owner, release_id: release.data.id, repo: REPO });
         await octokit.rest.git.deleteRef({ owner, repo: REPO, ref: "tags/v" + version });

         logger.releaseDeleted(version);
      } else {
         logger.releaseDoesNotExist(version);
      }
   }

   if (deleteAmazon) {
      try {
         const getCommand = new GetObjectCommand({ Bucket: AWS_BUCKET, Key: AWS_VERSIONS_OBJECT_KEY });
         const versions: VersionsObject = JSON.parse((await (await s3.send(getCommand)).Body?.transformToString()) ?? "");

         if (!(version in versions)) {
            logger.amazonDoesNotExist(version);
            return;
         }

         delete versions[version];

         const putCommand = new PutObjectCommand({
            Bucket: AWS_BUCKET,
            Key: AWS_VERSIONS_OBJECT_KEY,
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
