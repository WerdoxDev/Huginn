import { argv } from "bun";
import { build, copyPublicAssets, prepare, prerender } from "nitropack";
import { getContext } from "./test-utils";

const ctx = await getContext({ rootDir: argv[2] });

await prepare(ctx.nitro);
await copyPublicAssets(ctx.nitro);
await prerender(ctx.nitro);
await build(ctx.nitro);
await ctx.nitro.close();
