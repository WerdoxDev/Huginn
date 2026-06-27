import { S3Client, type S3Stats } from "bun";
import { join } from "pathe";

import type { FileCategory } from "#utils/types";

import { storageLogger } from "#loggers";
import { env } from "#setup";
import { Storage } from "#storage/storage";

export class S3Storage extends Storage {
   private s3: S3Client;

   public constructor() {
      super("s3");

      this.s3 = new S3Client({
         region: env.AWS_REGION,
         accessKeyId: env.AWS_KEY_ID,
         secretAccessKey: env.AWS_SECRET_KEY,
         bucket: env.AWS_BUCKET,
      });
   }

   public async getFile(category: FileCategory, subDirectory: string, name: string, start?: number, end?: number): Promise<Blob | undefined> {
      try {
         if (!(await this.exists(category, subDirectory, name))) {
            storageLogger.info({ category, subDirectory, filename: name }, "file not found");
            return undefined;
         }

         let file = this.s3.file(join(category, ...subDirectory.split("/"), name), {
            partSize: 5 * 1024 * 1024,
         });

         if (start || end) {
            file = file.slice(start, end);
         }

         storageLogger.info({ category, subDirectory, filename: name }, "get file");
         return file;
      } catch (e) {
         storageLogger.error(e, "failed to get file");
         return undefined;
      }
   }

   public async writeFile(category: FileCategory, subDirectory: string, name: string, data: Blob): Promise<boolean> {
      try {
         storageLogger.info({ category, subDirectory, filename: name }, "write file");

         const file = this.s3.file(join(category, ...subDirectory.split("/"), name));
         await file.write(data);
         return true;
      } catch (e) {
         storageLogger.error(e, "failed to write file");
         return false;
      }
   }

   public async exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean> {
      try {
         const exists = await this.s3.exists(join(category, ...subDirectory.split("/"), name));
         return exists;
      } catch (e) {
         storageLogger.error(e, "failed to check if file exists");
         return false;
      }
   }

   public async stat(category: FileCategory, subDirectory: string, name: string): Promise<S3Stats | undefined> {
      try {
         const stat = await this.s3.stat(join(category, ...subDirectory.split("/"), name));
         return stat;
      } catch (e) {
         storageLogger.error(e, "failed to get file stats");
         return undefined;
      }
   }
}
