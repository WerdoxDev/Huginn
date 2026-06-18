import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database/index";
import Elysia, { t } from "elysia";

const schema = t.Object({ token: t.String(), deviceId: t.String() });

export const postNotificationToken = new Elysia().use(verifyJwt()).post(
   "/api/auth/notification-token",
   async ({ body, status, tokenPayload }) => {
      await prisma.notificationToken.createOrUpdate({
         userId: tokenPayload.id,
         deviceId: body.deviceId,
         token: body.token,
      });
      return status("No Content");
   },
   { body: schema },
);
