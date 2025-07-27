import { access, constants } from "node:fs/promises";

export async function fileExists(filePath: string) {
   try {
      await access(filePath, constants.R_OK | constants.W_OK);
      return true;
      // oxlint-disable-next-line no-unused-vars
   } catch (e) {
      return false;
   }
}
