import type { FileCategory } from "#utils/types";

import { Storage } from "#storage/storage";
import { logFileNotFound, logGetFile, logWriteFile } from "@huginn/runtime-shared";
import { join } from "pathe";

export class FileStorage extends Storage {
   directory: string;

   public constructor(directory: string) {
      super("local");
      this.directory = directory;
   }

   public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<Blob | undefined> {
      try {
         if (!(await this.exists(category, subDirectory, name))) {
            logFileNotFound(category, subDirectory, name);
            return undefined;
         }

         const file = Bun.file(join(this.directory, category, ...subDirectory.split("/"), name));

         logGetFile(category, subDirectory, name);
         return file;
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         logFileNotFound(category, subDirectory, name);
         return undefined;
      }
   }

   public async writeFile(category: FileCategory, subDirectory: string, name: string, data: Blob): Promise<boolean> {
      logWriteFile(category, subDirectory, name);
      try {
         await Bun.write(join(this.directory, category, ...subDirectory.split("/"), name), data);
         return true;
      } catch (e) {
         console.error(this.name, "writeFile", e);
         return false;
      }
   }

   public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
      try {
         return await Bun.file(join(this.directory, category, ...subDirectory.split("/"), name)).exists();
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         logFileNotFound(category, subDirectory, name);
         return false;
      }
   }

   public async stat(category: FileCategory, subDirectory: string, name: string): Promise<unknown> {
      try {
         const stat = await Bun.file(join(this.directory, category, ...subDirectory.split("/"), name)).stat();
         return stat;
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         logFileNotFound(category, subDirectory, name);
         return undefined;
      }
   }
}
