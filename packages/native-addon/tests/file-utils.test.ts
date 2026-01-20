import { describe, expect, test } from "bun:test";
import addon from "../js/index";
import path from "node:path";

describe("file_util.h", () => {
   test("should successfully get the sha256 of a file", () => {
      const sha256 = addon.getFileSha256(path.join(__dirname, "test.txt"));
      expect(sha256).toMatchInlineSnapshot(`"12e8635bb2dd683fd215c2da2ae754435c95adf2eb20957bbd7b9dc38e9e9adc"`);
   });
});
