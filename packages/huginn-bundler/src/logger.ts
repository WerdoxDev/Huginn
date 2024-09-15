import consola from "consola";
import { colors } from "consola/utils";
import { BuildFlavour } from "./types";

const draftText = ` (${colors.yellow("draft")}) `;

export const logger = {
   bundlerInfo(): void {
      consola.log(colors.green(colors.bold("HUGINN BUNDLER\n")));
   },
   versionFieldsUpdated(version: string): void {
      consola.log("");
      consola.info(`Updated cargo version field to ${colors.cyan(version)}`);
   },
   buildingApp(version: string, flavour: BuildFlavour): void {
      consola.info(`Building Huginn ${colors.cyan(version)} (${getVersionTypeText(flavour)})`);
   },
   copyingBuildFiles(path: string): void {
      consola.info(`Copying build files to ${colors.cyan(path)}`);
   },
   versionExists(version: string): void {
      consola.warn(`Version ${colors.cyan(version)} already exists. Skipping build...`);
   },
   buildCompleted(version: string, flavour: BuildFlavour): void {
      consola.log("");
      consola.success(`Build completed for version ${colors.cyan(version)} (${getVersionTypeText(flavour)})`);
   },
   buildExists(version: string): void {
      consola.warn(`Tauri build for ${version} exists. Skipping build...`);
   },
   versionNotSuggested(version: string): void {
      consola.warn(
         `Version ${colors.cyan(version)} is not part of the suggested versions. See suggestions with ${colors.gray("--suggest")} or ${colors.gray("-s")} or force this with ${colors.gray("--force")}, ${colors.gray("-f")}`,
      );
   },

   creatingRelease(version: string, flavour: BuildFlavour, draft: boolean): void {
      consola.log("");
      consola.info(`Creating release${draft ? draftText : " "}for version ${colors.cyan(version)} (${getVersionTypeText(flavour)})`);
   },
   releaseExists(version: string): void {
      consola.log("");
      consola.warn(`Release for ${colors.cyan(version)} already exists. Updating instead...`);
   },
   deletingExistingAssets(version: string): void {
      consola.info(`Deleting existing assets for version ${colors.cyan(version)}`);
   },
   uploadingReleaseFiles(): void {
      consola.info("Uploading release files to GitHub...");
   },
   releaseCreated(version: string, flavour: BuildFlavour, draft: boolean): void {
      consola.log("");
      consola.success(
         `Created GitHub release${draft ? draftText : " "}for version ${colors.cyan(version)} (${getVersionTypeText(flavour)})`,
      );
   },
   releaseUpdated(version: string, flavour: BuildFlavour): void {
      consola.log("");
      consola.success(`Updated GitHub release for version ${colors.cyan(version)} (${getVersionTypeText(flavour)})`);
   },
   releaseLink(link: string): void {
      consola.info(`Release link: ${colors.cyan(link)}`);
   },

   creatingAmazonObject(): void {
      consola.info("Amazon S3 Object does not exist. Creating one...");
   },
   amazonExists(version: string): void {
      consola.info(`Version ${colors.cyan(version)} exists in Amazon S3. Updating instead...`);
   },
   updatingAmazonObject(version: string): void {
      consola.info(`Adding version ${colors.cyan(version)} to Amazon S3...`);
   },
   amazonObjectUpdated(version: string): void {
      consola.log("");
      consola.success(`Successfuly added/updated version ${colors.cyan(version)} in Amazon S3`);
   },

   versionDoesNotExist(version: string): void {
      consola.warn(`Version ${colors.cyan(version)} does not exist locally`);
   },
   releaseDoesNotExist(version: string): void {
      consola.warn(`Release ${colors.cyan(version)} does not exist on GitHub`);
   },
   amazonDoesNotExist(version: string): void {
      consola.warn(`Release ${colors.cyan(version)} does not exist on Amazon S3`);
   },
   versionDeleted(version: string): void {
      consola.success(`Successfuly deleted version ${colors.cyan(version)}`);
   },
   releaseDeleted(version: string): void {
      consola.success(`Successfuly deleted GitHub release ${colors.cyan(version)}`);
   },
   amazonDeleted(version: string): void {
      consola.success(`Successfuly deleted version ${colors.cyan(version)} from Amazon S3`);
   },
};

export function getVersionTypeText(flavour: BuildFlavour): string {
   return flavour === "nightly" ? colors.bold(colors.red("nightly")) : colors.bold(colors.green("release"));
}
