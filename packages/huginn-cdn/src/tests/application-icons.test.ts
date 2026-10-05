import { testHandler } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";
import path from "node:path";

describe("POST /application-icons/:id", () => {
   test("requires CDN authentication", async () => {
      const formData = new FormData();
      formData.append("files[0]", Bun.file(path.resolve(__dirname, "pixel.png")), "pixel.png");

      const result = testHandler("/cdn/application-icons/123", {}, "POST", formData);
      expect(result).rejects.toThrow("Unauthorized");
   });
});
