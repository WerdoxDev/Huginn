import { readFile, stat } from "node:fs/promises";
import { contentType } from "@std/media-types";
import { defineEventHandler, serveStatic } from "h3";
import { extname, join, resolve } from "pathe";
import { mainRouter } from "#server";

mainRouter.use(
	"/static/**",
	defineEventHandler((event) => {
		return serveStatic(event, {
			async getContents(id) {
				const path = join(__dirname, "..", id);
				return await readFile(path);
			},
			async getMeta(id) {
				const path = join(__dirname, "..", id);
				const stats = await stat(path).catch(() => {});

				if (!stats || !stats.isFile()) {
					return;
				}

				return {
					size: stats.size,
					mtime: stats.mtimeMs,
					type: contentType(extname(id)),
				};
			},
		});
	}),
);
