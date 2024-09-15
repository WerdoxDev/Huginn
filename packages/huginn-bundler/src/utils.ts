import { parseTOML, stringifyTOML } from "confbox";
import { readdir } from "node:fs/promises";
import path from "path";
import * as semver from "semver";
import { NSIS_RELATIVE_PATH, octokit } from ".";
import { BuildFlavour, CargoContent, GitHubRelease, type BuildFiles } from "./types";

/**
 * @returns a BuildFiles object that contains .exe and .sig files from the tauri debug/release build folder
 */
export async function getBuildFiles<Throw extends boolean>(
   buildPath: string,
   version: string,
   throwOnNotFound?: Throw,
): Promise<Throw extends true ? BuildFiles : BuildFiles | null> {
   const nsisFiles = await readdir(buildPath);

   const nsisSigFileName = nsisFiles.find(x => x.endsWith(".sig") && x.includes(version));
   const nsisSetupFileName = nsisFiles.find(x => x.endsWith("setup.exe") && x.includes(version));

   if (!nsisSigFileName || !nsisSetupFileName) {
      if (!throwOnNotFound) return null as never;
      throw new Error(`.exe or .sig file not found in (${path.join(buildPath, NSIS_RELATIVE_PATH)})`);
   }

   const nsisSigFilePath = path.join(buildPath, nsisSigFileName);
   const nsisSetupFilePath = path.join(buildPath, nsisSetupFileName);

   return {
      nsisSigFile: { name: nsisSigFileName, path: nsisSigFilePath },
      nsisSetupFile: { name: nsisSetupFileName, path: nsisSetupFilePath },
   };
}

/**
 * @returns a string of either 'nightly' or 'release' depending on the version
 */
export function getBuildFlavour(version: string): BuildFlavour {
   return semver.prerelease(version)?.includes("nightly") ? "nightly" : "release";
}

/**
 * @returns a github release id if it exists, otherwise null
 */
export async function getReleaseByTag(tag: string, owner: string, repo: string): Promise<GitHubRelease | null> {
   try {
      const release = await octokit.rest.repos.getReleaseByTag({ owner, repo, tag });
      return release;
   } catch {
      return null;
   }
}

/**
 * Writes the specified version to Cargo.toml file
 */
export async function writeCargoTomlVersion(path: string, version: string): Promise<void> {
   const cargoTomlFile = Bun.file(path);

   const content: CargoContent = parseTOML(await cargoTomlFile.text());
   content.package.version = version;

   const stringlified = stringifyTOML(content);
   await Bun.write(path, stringlified);
}

/**
 * @returns a bool indicating whether or not the directory exists
 */
export async function directoryExists(path: string): Promise<boolean> {
   try {
      await readdir(path);
      return true;
   } catch {
      return false;
   }
}

/**
 * @returns an object with 'url' and 'signature' of the specified file namings. Used to get each platform's update info
 */
export async function getDownloadInfo(
   release: GitHubRelease,
   runFileEnding: string,
   sigFileEnding: string,
): Promise<{ url: string; signature: string } | undefined> {
   const runFileAsset = release?.data.assets.find(x => x.name.endsWith(runFileEnding));
   const sigFileAsset = release?.data.assets.find(x => x.name.endsWith(sigFileEnding));

   if (!runFileAsset || !sigFileAsset) {
      return undefined;
   }

   const sigFileContent = await (await fetch(sigFileAsset.browser_download_url)).text();

   return { url: runFileAsset.browser_download_url, signature: sigFileContent };
}
