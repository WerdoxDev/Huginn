import { createRoute } from "@huginn/backend-shared";
import { tryResolveImage } from "#utils/route-utils";

createRoute("GET", "/channel-icons/:channelId/:iconHash", async (c) => {
	const { iconHash, channelId } = c.req.param();

	return tryResolveImage(c, "channel-icons", channelId, iconHash);
});
