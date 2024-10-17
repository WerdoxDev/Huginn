import { useValidatedParams } from "@huginn/backend-shared";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { router } from "#cdn";
import { tryResolveImage } from "#utils/route-utils";

const schema = z.object({ channelId: z.string(), iconHash: z.string() });

router.get(
	"/channel-icons/:channelId/:iconHash",
	defineEventHandler(async (event) => {
		const { iconHash, channelId } = await useValidatedParams(event, schema);

		return tryResolveImage(event, "channel-icons", channelId, iconHash);
	}),
);
