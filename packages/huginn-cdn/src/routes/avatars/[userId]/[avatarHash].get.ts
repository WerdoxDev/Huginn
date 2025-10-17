import { tryResolveImage } from "#utils/route-utils";
import Elysia, { StatusMap } from "elysia";

export const getUserAvatar = new Elysia().get("/cdn/avatars/:userId/:avatarHash", async ({ params: { avatarHash, userId } }) => {
   const { mimeType, readable } = await tryResolveImage("avatars", userId, avatarHash);

   return new Response(readable, { status: StatusMap["OK"], headers: { "content-type": mimeType } });
});
