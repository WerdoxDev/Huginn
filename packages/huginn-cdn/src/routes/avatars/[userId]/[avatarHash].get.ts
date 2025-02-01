import { createRoute } from "@huginn/backend-shared";
import { tryResolveImage } from "#utils/route-utils";

createRoute("GET", "/avatars/:userId/:avatarHash", async (c) => {
	const { avatarHash, userId } = c.req.param();

	return tryResolveImage(c, "avatars", userId, avatarHash);
});
