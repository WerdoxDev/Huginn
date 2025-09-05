import { testHandler } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";
import path from "node:path";

describe("POST /channel-icons/:channelId", () => {
   test("should return 403 (unauthorized) when no token is passed", async () => {
      const formData = new FormData();
      formData.append("files[0]", Bun.file(path.resolve(__dirname, "pixel.png")), "pixel.png");

      const result = testHandler("/cdn/channel-icons/test", {}, "POST", formData);
      expect(result).rejects.toThrow("Unauthorized");
   });
});
