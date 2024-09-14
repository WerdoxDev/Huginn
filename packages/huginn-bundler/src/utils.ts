import { parseTOML, stringifyTOML } from "confbox";
import { readdir } from "node:fs/promises";
import path from "path";
import * as semver from "semver";
import { NSIS_RELATIVE_PATH, octokit, REPO } from ".";
import { BuildFlavour, CargoContent, type BuildFiles, type Version } from "./types";

// /**
//  * @returns all version in either debug or release folders
//  */
// export async function getVersions(): Promise<AppVersion[]> {
//    const folders = (await readdir(BUILDS_PATH)).sort((v1, v2) => semver.order(v1.split("_")[0], v2.split("_")[0])).reverse();
//    return folders.map(x => ({ type: getFolderBuildType(x), version: stringToVersion(x) }));
// }

// /**
//  * @returns the given version with an increased patch number so 0.3.0 becomes 0.3.1
//  */
// export function getPatchedVersion(version: string, orderedVersions: AppVersion[]): string {
//    const latestVersion = orderedVersions[0]?.version ?? { major: 0, minor: 0, patch: 0 };
//    const versionToPatch = stringToVersion(version);

//    if (versionToPatch.patch !== undefined) throw new Error("Input version cannot have a patch number");
//    if (versionToPatch.major < latestVersion.major || versionToPatch.minor < latestVersion.minor)
//       throw new Error("Input version cannot be less than latest available version");

//    // If we have the same major and minor, just add 1 to the patch otherwise just a 0
//    if (versionToPatch.major === latestVersion.major && versionToPatch.minor === latestVersion.minor) {
//       versionToPatch.patch = latestVersion.patch! + 1;
//    } else {
//       versionToPatch.patch = 0;
//    }

//    return versionToString(versionToPatch);
// }

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
   const nsisSetupFileName = nsisFiles.find(x => x.endsWith(".exe") && x.includes(version));

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
 * @returns a Version object that contains major, minor, patch numbers
 */
export function stringToVersion(version: string): Version {
   // 0.0.0_release / 0.0.0_debug
   const wholeSplit = version.split("_");
   const versionSplit = wholeSplit[0].split(".");

   const patch = versionSplit[2] ?? undefined;
   if (versionSplit.length < 2) throw new Error("Version string was invalid");

   return { major: parseInt(versionSplit[0]), minor: parseInt(versionSplit[1]), patch: patch ? parseInt(patch) : undefined };
}

/**
 * @returns a String which contains major, minor, patch numbers
 */
export function versionToString(version: Version): string {
   return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * @returns a string of either 'nightly' or 'release' depending on the version
 */
export function getBuildFlavour(version: string): BuildFlavour {
   return semver.prerelease(version)?.includes("nightly") ? "nightly" : "release";
}

export async function getReleaseIdByTag(tag: string, owner: string, repo: string): Promise<number | null> {
   try {
      const release = await octokit.rest.repos.getReleaseByTag({ owner, repo, tag });
      return release.data.id;
   } catch {
      return null;
   }
}

// /**
//  * @returns returns either _debug or _release
//  */
// export function getVersionSuffix(type: BuildFlavour): string {
//    return type === BuildFlavour.DEBUG ? "_debug" : "_release";
// }

// /**
//  * @returns a folder name's build type indicated by _release or _debug
//  */
// export function getFolderBuildType(folderName: string): BuildFlavour {
//    if (folderName.endsWith("_debug")) return BuildFlavour.DEBUG;
//    else if (folderName.endsWith("_release")) return BuildFlavour.RELEASE;
//    return BuildFlavour.DEBUG;
// }

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
