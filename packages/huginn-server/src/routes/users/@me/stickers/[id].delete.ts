import { notFound, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

export const deleteUserSticker = new Elysia().use(verifyJwt()).delete(
   "/api/users/@me/stickers/:id",
   async ({ params, tokenPayload, status }) => {
      if (BigInt(params.id) > 9223372036854775807n) return notFound(status);
      const result = await prisma.sticker.deleteMany({ where: { id: BigInt(params.id), userId: BigInt(tokenPayload.id) } });
      if (!result.count) return notFound(status);
      // Keep the immutable CDN asset available for stickers already sent in messages.
      return status("No Content");
   },
   { params: t.Object({ id: t.String({ pattern: "^[0-9]{1,20}$" }) }) },
);
