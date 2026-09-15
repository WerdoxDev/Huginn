import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import addon from "../js/index";

describe("file_util.h", () => {
   test("should successfully get the sha256 of a file", () => {
      const filepath = path.join(__dirname, "test.txt");
      const expected = createHash("sha256").update(readFileSync(filepath)).digest("hex");

      expect(addon.getFileSha256(filepath)).toBe(expected);
   });
});
