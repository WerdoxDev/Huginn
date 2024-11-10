import { useValidatedParams } from "@huginn/backend-shared";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { router } from "#cdn";
import { tryResolveImage } from "#utils/route-utils";

const schema = z.object({ userId: z.string(), avatarHash: z.string() });

router.get(
	"/avatars/:userId/:avatarHash",
	defineEventHandler(async (event) => {
		const { avatarHash, userId } = await useValidatedParams(event, schema);

		return tryResolveImage(event, "avatars", userId, avatarHash);
	}),
);
