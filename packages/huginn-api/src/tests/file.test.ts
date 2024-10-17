import { describe, expect, test } from "bun:test";
import path from "node:path";
import { resolveFile, resolveImage, toDataUrl } from "@huginn/shared";
import { decodeBase64 } from "@std/encoding";

describe("file", () => {
	test("file-resolve-path", async () => {
		const result = toDataUrl((await resolveFile(path.join(__dirname, "pixel.png")))!.data);

		expect(result).toBe(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);
	});
	test("image-resolve-path", async () => {
		const result = await resolveImage(path.join(__dirname, "pixel.png"));

		expect(result).toBe(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);
	});
	test("image-resolve-base64", async () => {
		const resource = decodeBase64(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);

		const result = toDataUrl((await resolveFile(resource.buffer as ArrayBuffer))!.data);

		expect(result).toBe(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);
	});
});
