#! /usr/bin/env bun

import { input, select } from "@inquirer/prompts";
import consola from "consola";
import { Octokit } from "octokit";
import { $, semver, type ShellOutput } from "bun";
import { colors } from "consola/utils";
import { mkdir, readdir, rm } from "node:fs/promises";
import path from "path";
import {
   CARGO_TOML_PATH,
   BUILDS_PATH,
   GIST_ID,
   PACKAGE_JSON_PATH,
   REPO,
   TAURI_DEBUG_BUILD_PATH,
   TAURI_RELEASE_BUILD_PATH,
   getBuildFiles,
   getPatchedVersion,
   getVersions,
   stringToVersion,
   versionToString,
   writeCargoTomlVersion,
   writePackageJsonVersion,
   getVersionSuffix,
} from "./utils";
import { BuildType, type AppVersion, type UpdateFileInfo } from "./types";
import { getVersionTypeText, logger } from "./logger";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

logger.bundlerInfo();

const intent = await select({
   message: "Select an action:",
   choices: [
      { name: "Build", value: 0 },
      { name: "Create Release", value: 1 },
      { name: "Delete Release", value: 2 },
      { name: "Delete Build", value: 3 },
   ],
});

if (intent === 0) {
   const version = await input({ message: `Enter the desired version ${colors.red("without patch number")}:` });
   const debugOrRelease = await select({
      message: "Select a build mode:",
      choices: [
         { name: "Release", value: BuildType.RELEASE },
         { name: "Debug", value: BuildType.DEBUG },
      ],
   });

   await buildVersion(version, debugOrRelease);
} else if (intent === 1) {
   const versions = await getVersions();

   const version = await select({
      message: "Select the version to publish:",
      choices: versions.map((v) => ({
         name: `${versionToString(v.version)} ${getVersionTypeText(v.type)}`,
         value: v,
      })),
   });

   const description = await input({
      message: "Enter a description:",
   });

   await createGithubRelease(versionToString(version.version), version.type, description);
   await updateGistFile(version.type, versionToString(version.version), description);
   // await logVersions();
} else if (intent === 2) {
   const releases = await octokit.rest.repos.listReleases({ repo: REPO, owner: "WerdoxDev" });

   const versions: (AppVersion & { id: number; tag: string })[] = releases.data.map((x) => ({
      type: x.tag_name.includes("-dev") ? BuildType.DEBUG : BuildType.RELEASE,
      version: stringToVersion(x.tag_name.slice(1, 6)),
      id: x.id,
      tag: x.tag_name,
   }));

   const release = await select({
      message: "Select a release to delete:",
      choices: versions.map((v) => ({ name: `${versionToString(v.version)} ${getVersionTypeText(v.type)}`, value: v })),
   });

   await octokit.rest.repos.deleteRelease({ owner: "WerdoxDev", repo: REPO, release_id: release.id });
   await octokit.rest.git.deleteRef({ owner: "WerdoxDev", repo: REPO, ref: `tags/${release.tag}` });

   logger.releaseDeleted(versionToString(release.version), release.type);
} else if (intent === 3) {
   const versions = await getVersions();

   const version = await select({
      message: "Select the version to delete:",
      choices: versions.map((v) => ({
         name: `${versionToString(v.version)} ${getVersionTypeText(v.type)}`,
         value: v,
      })),
   });

   await rm(path.resolve(BUILDS_PATH, versionToString(version.version) + getVersionSuffix(version.type)), {
      force: true,
      recursive: true,
   });

   logger.versionDeleted(versionToString(version.version), version.type);
}

async function buildVersion(version: string, type: BuildType) {
   try {
      const versions = await getVersions();
      const newVersion = getPatchedVersion(version, versions);
      const newVersionPath = path.resolve(BUILDS_PATH, newVersion + getVersionSuffix(type));

      logger.startingBuild(newVersion, type);

      logger.versionFieldsUpdated(newVersion);
      // Update the version numbers in cargo.toml and package.json
      await writeCargoTomlVersion(CARGO_TOML_PATH, newVersion);
      await writePackageJsonVersion(PACKAGE_JSON_PATH, newVersion);

      logger.buildingApp(newVersion);

      // Set environment variables for tauri
      $.env({
         ...process.env,
         TAURI_PRIVATE_KEY: process.env.TAURI_PRIVATE_KEY,
         TAURI_KEY_PASSWORD: process.env.TAURI_KEY_PASSWORD,
      });

      // Run the build script and log the result
      let result: ShellOutput;

      if (type === BuildType.DEBUG) result = await $`cd ../huginn-app-react && bun tauri-build --debug`.quiet();
      else result = await $`cd ../huginn-app-react && bun tauri-build`.quiet();

      logger.copyingBuildFiles(newVersionPath);

      // Create a directory for the new version
      await mkdir(newVersionPath);

      const files = await getBuildFiles(type === BuildType.DEBUG ? TAURI_DEBUG_BUILD_PATH : TAURI_RELEASE_BUILD_PATH, newVersion);

      // Get blob for both .zip and .sig files
      const zipFile = Bun.file(files.zipFile.path);
      const sigFile = Bun.file(files.sigFile.path);

      // Copy .zip and .sig files to our new version's folder
      await Bun.write(path.resolve(newVersionPath, files.zipFile.name), zipFile);
      await Bun.write(path.resolve(newVersionPath, files.sigFile.name), sigFile);

      logger.buildCompleted(newVersion, type);
   } catch (e) {
      consola.error("Something went wrong... ");
      throw e;
   }
}

async function createGithubRelease(version: string, type: BuildType, description: string) {
   logger.creatingRelease(version, type);

   // Create the release with a description
   const releaseName = type === BuildType.DEBUG ? `v${version}-dev` : `v${version}`;

   const release = await octokit.rest.repos.createRelease({
      owner: "WerdoxDev",
      repo: REPO,
      name: releaseName,
      tag_name: releaseName,
      target_commitish: "master",
      body: description,
   });

   // Get build files from debug or release folders
   const files = await getBuildFiles(path.resolve(BUILDS_PATH, version + getVersionSuffix(type)), version);

   logger.uploadingReleaseFiles();
   // Convert build files to strings
   const zipFileString = await Bun.file(files.zipFile.path).arrayBuffer();
   const sigFileString = await Bun.file(files.sigFile.path).text();

   // Upload both .zip and .sig files to the release
   await octokit.rest.repos.uploadReleaseAsset({
      name: files.zipFile.name,
      release_id: release.data.id,
      owner: "WerdoxDev",
      repo: REPO,
      data: zipFileString as unknown as string,
      headers: { "content-type": "application/zip" },
   });

   await octokit.rest.repos.uploadReleaseAsset({
      name: files.sigFile.name,
      release_id: release.data.id,
      owner: "WerdoxDev",
      repo: REPO,
      data: sigFileString,
   });

   logger.releaseCreated(version, type);
}

async function updateGistFile(type: BuildType, version: string, description: string) {
   const files = await getBuildFiles(path.resolve(BUILDS_PATH, version + getVersionSuffix(type)), version);

   const sigFileString = await Bun.file(files.sigFile.path).text();
   const publishDate = new Date(Bun.file(files.zipFile.path).lastModified).toISOString();

   const url = `https://github.com/WerdoxDev/${REPO}/releases/download/v${
      version + (type === BuildType.DEBUG ? "-dev" : "")
   }/Huginn_${version}_x64-setup.nsis.zip`;

   const content: UpdateFileInfo = {
      version: `${version}`,
      pub_date: publishDate,
      notes: description,
      platforms: {
         "windows-x86_64": { signature: sigFileString, url: url },
      },
   };

   logger.updatingGistFile();

   await octokit.rest.gists.update({
      gist_id: GIST_ID,
      description: description,
      files: { "huginn-version.json": { filename: "huginn-version.json", content: JSON.stringify(content, null, 2) } },
   });

   logger.gistFileUpdated(version, type);
}

// async function logVersions() {
//    consola.start("Reading versions...\n");
//    const folders = await getVersions(BuildType.RELEASE);

//    if (folders.length === 0) {
//       consola.fail("No versions are currently available!");
//       return;
//    }

//    for (let i = 0; i < folders.length; i++) {
//       const folder = folders[i];
//       const versionText = colors.cyan(folder);
//       const isLatestText = i === 0 ? colors.bold(colors.green("Latest")) : "";

//       consola.info(`Version ${versionText} ${isLatestText}`);
//    }
// }
