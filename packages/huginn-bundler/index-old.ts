#! /usr/bin/env bun

import { $, semver } from "bun";
import consola, { Consola } from "consola";
import { colors } from "consola/utils";
import { mkdir, readdir } from "node:fs/promises";
import { Octokit } from "octokit";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const debugBuildsPath = "/home/werdox-wsl/Huginn/packages/huginn-bundler/builds/debug/";
const tauriBuildPath =
   "/home/werdox-wsl/Huginn/packages/huginn-app/src-tauri/target/x86_64-pc-windows-msvc/debug/bundle/nsis/";
const cargoTomlPath = "/home/werdox-wsl/Huginn/packages/huginn-app/src-tauri/Cargo.toml";
const packageJsonPath = "/home/werdox-wsl/Huginn/packages/huginn-app/package.json";

const gistId = process.env.GIST_ID as string;
const repo = process.env.REPO_NAME as string;

const octokit = new Octokit({ auth: process.env.TOKEN });

yargs(hideBin(process.argv))
   .command("list", "Lists all available versions", () => {}, listVersions)
   .command(
      "build <version-number> [no-release]",
      "Builds and bundles the app",
      (yargs) =>
         yargs
            .positional("version-number", {
               description: "The version of the app. Will automatically increase the patch version if provided a 0",
               type: "string",
            })
            .option("no-release", {
               description: "If set, will not create a github release",
               type: "boolean",
               default: false,
               boolean: true,
            }),
      (argv) => buildVersion(argv.versionNumber || "", argv.noRelease)
   )
   .command(
      "release <versionNumber>",
      "Creates a new github release given the version",
      (yargs) =>
         yargs.positional("versionNumber", {
            description: "The version of which to create a github release",
            type: "string",
         }),
      (argv) => createGithubRelease(argv.versionNumber || "")
   )
   .command(
      "gist <versionNumber>",
      "Updates the private gist file using the version",
      (yargs) =>
         yargs.positional("versionNumber", {
            description: "The version of which to update the gist with",
            type: "string",
         }),
      (argv) => updateGistFile(argv.versionNumber || "")
   )
   .parse();

async function listVersions() {
   consola.start("Reading versions...\n");
   const folders = await getVersions();

   if (folders.length === 0) {
      consola.fail("No versions are currently available!");
      return;
   }

   for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const versionText = colors.cyan(folder);
      const isLatestText = i === 0 ? colors.bold(colors.green("Latest")) : "";

      consola.info(`Version ${versionText} ${isLatestText}`);
   }
}

async function buildVersion(version: string, noRelease: boolean) {
   try {
      const newVersion = await getNewVersion(version);
      const newVersionPath = path.resolve(debugBuildsPath, newVersion);

      await setCargoVersion(newVersion);
      await setPackageJsonVersion(newVersion);

      consola.info(
         `Building Huginn ${colors.cyan(newVersion + "...")} ${noRelease ? colors.gray("(no release)") : ""}`
      );
      const result = await $`cd ../huginn-app && bun tauri-build`.quiet();

      consola.log(result.stdout.toString());
      await mkdir(newVersionPath);

      const files = await getUpdateFiles(tauriBuildPath, newVersion, newVersion, false);

      const zipFile = Bun.file(files.zipFilePath);
      const sigFile = Bun.file(files.sigFilePath);

      await Bun.write(path.resolve(newVersionPath, files.zipFileName), zipFile);
      await Bun.write(path.resolve(newVersionPath, files.sigFileName), sigFile);

      consola.success(`Build complete for version ${colors.cyan(newVersion)}`);

      if (noRelease) {
         return;
      }

      await createGithubRelease(newVersion);

      consola.success(`Created github release`);

      await updateGistFile(newVersion);

      consola.success("Updated gist to new version");
   } catch (e) {
      consola.error("Something went wrong... ");
      throw e;
   }
}

async function createGithubRelease(version: string) {
   const release = await octokit.rest.repos.createRelease({
      owner: "WerdoxDev",
      repo: repo,
      tag_name: `v${version}-dev`,
      target_commitish: "master",
      body: "A new release in the dev branch",
   });

   const files = await getUpdateFiles(debugBuildsPath, version);

   const zipFileString = await Bun.file(files.zipFilePath).arrayBuffer();
   const sigFileString = await Bun.file(files.sigFilePath).text();

   await octokit.rest.repos.uploadReleaseAsset({
      name: files.zipFileName,
      release_id: release.data.id,
      owner: "WerdoxDev",
      repo: repo,
      data: zipFileString.toString(),
      headers: { "content-type": "application/zip" },
   });

   await octokit.rest.repos.uploadReleaseAsset({
      name: files.sigFileName,
      release_id: release.data.id,
      owner: "WerdoxDev",
      repo: repo,
      data: sigFileString,
   });
}

async function updateGistFile(version: string) {
   const files = await getUpdateFiles(debugBuildsPath, version);

   const sigFileString = await Bun.file(files.sigFilePath).text();
   const publishDate = new Date(Bun.file(files.zipFilePath).lastModified).toISOString();

   const url = `https://github.com/WerdoxDev/${repo}/releases/download/v${version}-dev/Huginn_${version}_x64-setup.nsis.zip`;

   const content: UpdateFileInfo = {
      version: `${version}`,
      pub_date: publishDate,
      notes: `Updated to version ${version}!`,
      platforms: {
         "windows-x86_64": { signature: sigFileString, url: url },
      },
   };

   await octokit.rest.gists.update({
      gist_id: gistId,
      description: `Updated to version ${version}!`,
      files: { "huginn-version.json": { filename: "huginn-version.json", content: JSON.stringify(content, null, 2) } },
   });
}

async function getUpdateFiles(
   rootFolder: string,
   version: string,
   filter?: string,
   versionAsDirectory: boolean = true
) {
   const files = await readdir(path.resolve(rootFolder, versionAsDirectory ? version : ""));

   const zipFileName = files.find((x) => x.endsWith(".zip") && x.includes(filter || ""))!;
   const sigFileName = files.find((x) => x.endsWith(".sig") && x.includes(filter || ""))!;

   const zipFilePath = path.resolve(rootFolder, versionAsDirectory ? version : "", zipFileName);
   const sigFilePath = path.resolve(rootFolder, versionAsDirectory ? version : "", sigFileName);

   return { zipFileName, sigFileName, zipFilePath, sigFilePath };
}

async function getVersions() {
   const folders = (await readdir(debugBuildsPath)).sort(semver.order).reverse();
   return folders;
}

async function getNewVersion(version: string) {
   const versionInFolder = (await getVersions()).find((x) => x.split(".")[1] === version.split(".")[1]);
   let versionToModify = versionInFolder || version;

   const split = versionToModify.split(".");
   const patchNumber = versionInFolder ? (parseInt(split[2]) + 1).toString() : "0";

   return `${split[0]}.${split[1]}.${patchNumber}`;
}

type UpdateFileInfo = {
   version: string;
   notes: string;
   pub_date: string;
   platforms: { [k: string]: { signature: string; url: string } };
};
