import { describe, expect, test } from "bun:test";
import { resolveBase64, resolveFile, resolveImage } from "../file-resolver";
import path from "path";

describe("file", () => {
   test("file-resolve-path", async () => {
      const result = resolveBase64((await resolveFile(path.resolve(__dirname, "./pixel.png"))).data);

      expect(result).toBe(
         "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
      );
   });
   test("image-resolve-path", async () => {
      const result = await resolveImage(path.resolve(__dirname, "./pixel.png"));

      expect(result).toBe(
         "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
      );
   });
   test("image-resolve-buffer", async () => {
      const buffer = Buffer.from(
         "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
         "base64",
      );

      const result = resolveBase64((await resolveFile(buffer)).data);

      expect(result).toBe(
         "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
      );
   });
});
