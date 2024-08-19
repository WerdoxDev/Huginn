import { afterAll, beforeAll } from "bun:test";
import { unlink } from "node:fs/promises";
import path from "path";

async function deleteTestFiles() {
   for (const format of ["png", "jpeg", "jpg", "webp"]) {
      const file = Bun.file(path.join(__dirname, "..", "..", "uploads", "avatars", `pixel.${format}`));
      if (await file.exists()) {
         // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
         await unlink(file.name!);
      }
   }
}

beforeAll(async () => {
   await deleteTestFiles();
});

afterAll(async () => {
   await deleteTestFiles();
});
