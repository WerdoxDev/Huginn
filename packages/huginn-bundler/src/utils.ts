import { readdir } from "node:fs/promises";
import path from "node:path";
import { parseJSON, parseTOML, stringifyJSON, stringifyTOML } from "confbox";
import * as semver from "semver";
import { envs, octokit, packages } from ".";
import type { BuildFiles, BuildFlavour, CargoContent, GitHubRelease, PackageType } from "./types";

/**
 * @returns a BuildFiles object that contains .exe and .sig files from the tauri debug/release build folder
 */
export async function getBuildFiles<Throw extends boolean>(
	buildPath: string,
	version: string,
	throwOnNotFound?: Throw,
): Promise<Throw extends true ? BuildFiles : BuildFiles | null> {
	if (!(await directoryExists(buildPath))) {
		if (!throwOnNotFound) return null as never;
		throw new Error(`Directory ${buildPath} does not exist`);
	}
	const nsisFiles = await readdir(buildPath);

	const nsisSigFileName = nsisFiles.find((x) => x.endsWith(".sig") && x.includes(`${version}_x64`));
	const nsisSetupFileName = nsisFiles.find((x) => x.endsWith("setup.exe") && x.includes(`${version}_x64`));

	if (!nsisSigFileName || !nsisSetupFileName) {
		if (!throwOnNotFound) return null as never;
		throw new Error(`.exe or .sig file not found in (${path.join(buildPath, envs.NSIS_RELATIVE_PATH)})`);
	}

	const nsisSigFilePath = path.join(buildPath, nsisSigFileName);
	const nsisSetupFilePath = path.join(buildPath, nsisSetupFileName);

	return {
		nsisSigFile: { name: nsisSigFileName, path: nsisSigFilePath },
		nsisSetupFile: { name: nsisSetupFileName, path: nsisSetupFilePath },
	};
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

export async function writePackageJsonVersion(path: string, version: string): Promise<void> {
	const packageJsonContent = await Bun.file(path).json();

	packageJsonContent.version = version;
	const stringlified = stringifyJSON(packageJsonContent);
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
	const runFileAsset = release?.data.assets.find((x) => x.name.endsWith(runFileEnding));
	const sigFileAsset = release?.data.assets.find((x) => x.name.endsWith(sigFileEnding));

	if (!runFileAsset || !sigFileAsset) {
		return undefined;
	}

	const sigFileContent = await (await fetch(sigFileAsset.browser_download_url)).text();

	return { url: runFileAsset.browser_download_url, signature: sigFileContent };
}

export function getPackage(packageType: PackageType) {
	const foundPackage = Object.values(packages).find((x) => x.type === packageType);
	if (!foundPackage) {
		throw new Error(`Package of type ${packageType} was not found`);
	}
	return foundPackage as { path: string; name: string; type: PackageType };
}

export function getStrippedVersion(packageType: PackageType, tag: string) {
	const packageName = getPackage(packageType).name;
	return tag.replace(`${packageName}-`, "").trim();
}

export async function getPackageReleases(packageType: PackageType) {
	const packageName = getPackage(packageType).name;
	const releases = (await octokit.rest.repos.listReleases({ owner: "WerdoxDev", repo: envs.REPO_NAME })).data
		.filter((x) => x.tag_name.includes(packageName))
		.sort((v1, v2) => semver.rcompare(getStrippedVersion(packageType, v1.tag_name), getStrippedVersion(packageType, v2.tag_name)));

	return releases;
}

export async function getPackageVersion(packageType: PackageType) {
	const packagePath = getPackage(packageType).path;
	const packageJson = await Bun.file(path.join(packagePath, "package.json")).json();
	return packageJson.version as string;
}
