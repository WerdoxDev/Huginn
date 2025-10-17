import { tryResolveImage } from "#utils/route-utils";
import Elysia, { StatusMap } from "elysia";

export const getChannelIcon = new Elysia().get("/cdn/channel-icons/:channelId/:iconHash", async ({ params: { channelId, iconHash } }) => {
   const { mimeType, readable } = await tryResolveImage("channel-icons", channelId, iconHash);

   return new Response(readable, { status: StatusMap["OK"], headers: { "content-type": mimeType } });
});
