import { join } from "pathe";

import type { FileCategory } from "#utils/types";

import { storageLogger } from "#loggers";
import { Storage } from "#storage/storage";

export class FileStorage extends Storage {
   directory: string;

   public constructor(directory: string) {
      super("local");
      this.directory = directory;
   }

   public async getFile(category: FileCategory, subDirectory: string, name: string): Promise<Blob | undefined> {
      try {
         if (!(await this.exists(category, subDirectory, name))) {
            storageLogger.info({ category, subDirectory, filename: name }, "file not found");
            return undefined;
         }

         const file = Bun.file(join(this.directory, category, ...subDirectory.split("/"), name));

         storageLogger.info({ category, subDirectory, filename: name }, "get file");
         return file;
      } catch (e) {
         storageLogger.error(e, "failed to get file");
         return undefined;
      }
   }

   public async writeFile(category: FileCategory, subDirectory: string, name: string, data: Blob): Promise<boolean> {
      storageLogger.info({ category, subDirectory, filename: name }, "write file");
      try {
         await Bun.write(join(this.directory, category, ...subDirectory.split("/"), name), data);
         return true;
      } catch (e) {
         storageLogger.error(e, "failed to write file");
         return false;
      }
   }

   public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
      try {
         return await Bun.file(join(this.directory, category, ...subDirectory.split("/"), name)).exists();
      } catch (e) {
         storageLogger.info({ category, subDirectory, filename: name }, "file not found");
         return false;
      }
   }

   public async stat(category: FileCategory, subDirectory: string, name: string): Promise<unknown> {
      try {
         const stat = await Bun.file(join(this.directory, category, ...subDirectory.split("/"), name)).stat();
         return stat;
      } catch (e) {
         storageLogger.error(e, "failed to get file stats");
         return undefined;
      }
   }
}
