#! /usr/bin/env bun
/* eslint-disable @typescript-eslint/no-non-null-assertion */

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
import { directoryExists, getBuildFiles, getBuildFlavour, getReleaseByTag, writeCargoTomlVersion } from "./utils";

export const APP_PATH: string = process.env.APP_PATH!;
export const BUILDS_PATH: string = process.env.BUILDS_PATH!;

export const TAURI_BUILD_PATH: string = process.env.TAURI_BUILD_PATH!;

export const NSIS_RELATIVE_PATH = "/bundle/nsis";

export const CARGO_TOML_PATH: string = process.env.CARGO_TOML_PATH!;

export const GIST_ID: string = process.env.GIST_ID!;
export const REPO: string = process.env.REPO_NAME!;

export const octokit: Octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const main = defineCommand({
   meta: {
      name: "huginn-bundler",
      version: "0.0.1",
      description: "Very simple bundler that builds the Huginn App and uploads it to github!",
   },
   args: {
      version: {
         type: "string",
         alias: "v",
         required: false,
         description: "A SemVer string for the build or upload",
         valueHint: "SEMVER",
      },
      delete: {
         type: "string",
         alias: "x",
         description: "Deletes the provided SemVer version both locally and on GitHub if it exists",
         valueHint: "SEMVER",
         required: false,
      },
      deleteGithub: {
         type: "string",
         alias: "g",
         description: "Deletes the provided SemVer from GitHub and keeps the local version",
         valueHint: "SEMVER",
         required: false,
      },
      upload: {
         type: "boolean",
         alias: "u",
         description: "Uploads the build to GitHub as a release. If build already exists, it skips building it again",
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
         description: "Force build a version although it's not recommended by the suggestion",
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
         await build(args.version, args.force);

         if (args.upload) {
            if (args.draft) {
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

            const description = await consola.prompt("Enter a description:", { type: "text" });
            await createRelease(args.version, description, args.draft);
            return;
         }

         return;
      } else if (args.delete || args.deleteGithub) {
         await deleteVersion(args.delete ?? args.deleteGithub, !!args.deleteGithub);
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

async function build(version: string, force?: boolean) {
   try {
      const versionDir = path.join(BUILDS_PATH, version);
      const buildPath = path.join(TAURI_BUILD_PATH, NSIS_RELATIVE_PATH);

      if (await directoryExists(versionDir)) {
         logger.versionExists(version);
         return;
      }

      const suggestions = await getSuggestions();
      const suggestedVersions = [suggestions.nextNightly, suggestions.nextPatch, suggestions.nextMinor, suggestions.nextMajor];

      if (!suggestedVersions.includes(version) && !force) {
         logger.versionNotSuggested(version);
         return;
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

async function deleteVersion(version: string, onlyGithub: boolean) {
   const owner = "WerdoxDev";
   const versionDir = path.join(BUILDS_PATH, version);

   if (!onlyGithub) {
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

   const release = await getReleaseByTag(`v${version}`, owner, REPO);

   if (release) {
      await octokit.rest.repos.deleteRelease({ owner, release_id: release.data.id, repo: REPO });
      await octokit.rest.git.deleteRef({ owner, repo: REPO, ref: "tags/v" + version });

      logger.releaseDeleted(version);
   } else {
      logger.releaseDoesNotExist(version);
   }
}
