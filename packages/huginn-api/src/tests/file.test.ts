import { describe, expect, test } from "bun:test";
import path from "node:path";
import { resolveFile, resolveImage, toDataUrl } from "@huginn/shared";
import { decodeBase64 } from "@std/encoding";

describe("file resolver", () => {
	test("should resolve a file using it's system path", async () => {
		const result = toDataUrl((await resolveFile(path.join(__dirname, "pixel.png")))!.data);

		expect(result).toBe(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);
	});
	test("should return a data url image from system path", async () => {
		const result = await resolveImage(path.join(__dirname, "pixel.png"));

		expect(result).toBe(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);
	});
	test("should create a data url from a base64 string", async () => {
		const resource = decodeBase64(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);

		const result = toDataUrl((await resolveFile(resource.buffer as ArrayBuffer))!.data);

		expect(result).toBe(
			"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAANSURBVBhXY2BgYPgPAAEEAQBwIGULAAAAAElFTkSuQmCC",
		);
	});
});
