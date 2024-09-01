/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { semver } from "bun";
import { readdir } from "node:fs/promises";
import path from "path";
import { BuildType, type AppVersion, type BuildFiles, type Version } from "./types";

export const APP_PATH: string = process.env.APP_PATH!;
export const BUILDS_PATH: string = process.env.BUILDS_PATH!;

export const TAURI_DEBUG_NSIS_PATH: string = process.env.TAURI_DEBUG_NSIS_PATH!;
export const TAURI_RELEASE_NSIS_PATH: string = process.env.TAURI_RELEASE_NSIS_PATH!;

export const CARGO_TOML_PATH: string = process.env.CARGO_TOML_PATH!;
export const PACKAGE_JSON_PATH: string = process.env.PACKAGE_JSON_PATH!;

export const GIST_ID: string = process.env.GIST_ID!;
export const REPO: string = process.env.REPO_NAME!;

/**
 * @returns all version in either debug or release folders
 */
export async function getVersions(): Promise<AppVersion[]> {
   console.log(BUILDS_PATH, "NULL");
   const folders = (await readdir(BUILDS_PATH)).sort((v1, v2) => semver.order(v1.split("_")[0], v2.split("_")[0])).reverse();
   return folders.map(x => ({ type: getFolderBuildType(x), version: stringToVersion(x) }));
}

/**
 * @returns the given version with an increased patch number so 0.3.0 becomes 0.3.1
 */
export function getPatchedVersion(version: string, orderedVersions: AppVersion[]): string {
   const latestVersion = orderedVersions[0]?.version ?? { major: 0, minor: 0, patch: 0 };
   const versionToPatch = stringToVersion(version);

   if (versionToPatch.patch !== undefined) throw new Error("Input version cannot have a patch number");
   if (versionToPatch.major < latestVersion.major || versionToPatch.minor < latestVersion.minor)
      throw new Error("Input version cannot be less than latest available version");

   // If we have the same major and minor, just add 1 to the patch otherwise just a 0
   if (versionToPatch.major === latestVersion.major && versionToPatch.minor === latestVersion.minor) {
      versionToPatch.patch = latestVersion.patch! + 1;
   } else {
      versionToPatch.patch = 0;
   }

   return versionToString(versionToPatch);
}

/**
 * @returns a BuildFiles object that contains both .zip and .sig files from the tauri debug/release build folder
 */
export async function getBuildFiles(buildPath: string, version: string): Promise<BuildFiles> {
   const files = await readdir(buildPath);

   const zipFileName = files.find(x => x.endsWith(".zip") && x.includes(version));
   const sigFileName = files.find(x => x.endsWith(".sig") && x.includes(version));
   const msiFileName = files.find(x => )

   if (!zipFileName || !sigFileName) throw new Error(`.zip or .sig file not found in (${buildPath})`);

   const zipFilePath = path.resolve(buildPath, zipFileName);
   const sigFilePath = path.resolve(buildPath, sigFileName);

   return { zipFile: { name: zipFileName, path: zipFilePath }, sigFile: { name: sigFileName, path: sigFilePath } };
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
 * @returns returns either _debug or _release
 */
export function getVersionSuffix(type: BuildType): string {
   return type === BuildType.DEBUG ? "_debug" : "_release";
}

/**
 * @returns a folder name's build type indicated by _release or _debug
 */
export function getFolderBuildType(folderName: string): BuildType {
   if (folderName.endsWith("_debug")) return BuildType.DEBUG;
   else if (folderName.endsWith("_release")) return BuildType.RELEASE;
   return BuildType.DEBUG;
}

/**
 * Writes the specified version to Cargo.toml file
 */
export async function writeCargoTomlVersion(path: string, version: string): Promise<void> {
   const cargoToml = Bun.file(path);

   const text = await cargoToml.text();
   const modifiedText = text
      .split("\n")
      .map(x => {
         if (x.startsWith("version = ")) {
            return `version = "${version}"`;
         }

         return x;
      })
      .join("\n");

   await Bun.write(path, modifiedText);
}

/**
 * Writes the specified version to a package.json file
 */
export async function writePackageJsonVersion(path: string, version: string): Promise<void> {
   const packageJson = Bun.file(path);

   const text = await packageJson.text();
   const modifiedText = text
      .split("\n")
      .map(x => {
         if (x.trim().startsWith('"version"')) {
            return `"version": "${version}",`;
         }

         return x;
      })
      .join("\n");

   await Bun.write(path, modifiedText);
}
