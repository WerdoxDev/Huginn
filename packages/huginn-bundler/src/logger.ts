import consola from "consola";
import { colors } from "consola/utils";
import type { BuildFlavour, PackageType } from "./types";

const draftText = ` (${colors.yellow("draft")}) `;

export const logger = {
	bundlerInfo(): void {
		consola.log(colors.green(colors.bold("HUGINN BUNDLER\n")));
	},
	cargoVersionUpdated(version: string): void {
		consola.info(`Updated cargo version field to ${colors.cyan(version)}`);
	},
	packageVersionUpdated(packageType: PackageType, version: string) {
		consola.info(`Updated ${colors.gray(packageType)} package version to ${colors.cyan(version)}`);
	},
	buildingApp(version: string): void {
		consola.info(`Building Huginn App ${colors.cyan(version)}`);
	},
	copyingBuildFiles(path: string): void {
		consola.info(`Copying build files to ${colors.cyan(path)}`);
	},
	versionExists(version: string): void {
		consola.warn(`Version ${colors.cyan(version)} already exists. Skipping build...`);
	},
	buildCompleted(version: string): void {
		consola.success(`App build completed for version ${colors.cyan(version)}`);
	},
	buildExists(version: string): void {
		consola.warn(`Tauri build for ${version} exists. Skipping build...`);
	},
	versionNotSuggested(version: string): void {
		consola.warn(
			`Version ${colors.cyan(version)} is not part of the suggested versions. See suggestions with ${colors.gray("--suggest")} or ${colors.gray("-s")} or force this with ${colors.gray("--force")}, ${colors.gray("-f")}`,
		);
	},

	creatingRelease(packageType: PackageType, version: string, draft: boolean): void {
		consola.info(`Creating release${draft ? draftText : " "}${colors.cyan(version)} for package ${colors.gray(packageType)}`);
	},
	releaseExists(version: string): void {
		consola.warn(`Release for ${colors.cyan(version)} already exists.`);
	},
	deletingExistingAssets(version: string): void {
		consola.info(`Deleting existing app assets for version ${colors.cyan(version)}`);
	},
	uploadingReleaseFiles(): void {
		consola.info("Uploading app files to GitHub...");
	},
	releaseCreated(packageType: PackageType, version: string, draft: boolean): void {
		consola.success(`Created GitHub release${draft ? draftText : " "}${colors.cyan(version)} for package ${colors.gray(packageType)}`);
	},
	releaseUpdated(version: string): void {
		consola.success(`Updated GitHub app release files for version ${colors.cyan(version)}`);
	},
	releaseLink(link: string): void {
		consola.info(`Release link: ${colors.cyan(link)}`);
	},

	creatingAmazonObject(): void {
		consola.info("Amazon S3 Object does not exist. Creating one...");
	},
	amazonExists(version: string): void {
		consola.info(`App version ${colors.cyan(version)} exists in Amazon S3. Updating instead...`);
	},
	updatingAmazonObject(version: string): void {
		consola.info(`Adding app version ${colors.cyan(version)} to Amazon S3...`);
	},
	amazonObjectUpdated(version: string): void {
		consola.success(`Successfuly added/updated app version ${colors.cyan(version)} in Amazon S3`);
	},

	versionDoesNotExist(version: string): void {
		consola.warn(`Version ${colors.cyan(version)} does not exist locally`);
	},
	releaseDoesNotExist(packageType: PackageType, version: string): void {
		consola.warn(`Release ${colors.cyan(version)} for package ${colors.gray(packageType)} does not exist on GitHub`);
	},
	amazonDoesNotExist(version: string): void {
		consola.warn(`Release ${colors.cyan(version)} does not exist on Amazon S3`);
	},
	versionDeleted(version: string): void {
		consola.success(`Successfuly deleted version ${colors.cyan(version)}`);
	},
	releaseDeleted(packageType: PackageType, version: string): void {
		consola.success(`Successfuly deleted GitHub release ${colors.cyan(version)} for package ${colors.gray(packageType)}`);
	},
	amazonDeleted(version: string): void {
		consola.success(`Successfuly deleted version ${colors.cyan(version)} from Amazon S3`);
	},
};
