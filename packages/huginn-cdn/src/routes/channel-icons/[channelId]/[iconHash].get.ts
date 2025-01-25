import { useValidatedParams } from "@huginn/backend-shared";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { tryResolveImage } from "#utils/route-utils";

const schema = z.object({ channelId: z.string(), iconHash: z.string() });

export default defineEventHandler(async (event) => {
	const { iconHash, channelId } = await useValidatedParams(event, schema);

	return tryResolveImage(event, "channel-icons", channelId, iconHash);
});
