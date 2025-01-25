import { build, copyPublicAssets, prepare, prerender } from "nitropack";
import { getContext } from "./utils";

const ctx = await getContext();

await prepare(ctx.nitro);
await copyPublicAssets(ctx.nitro);
await prerender(ctx.nitro);
await build(ctx.nitro);
await ctx.nitro.close();
