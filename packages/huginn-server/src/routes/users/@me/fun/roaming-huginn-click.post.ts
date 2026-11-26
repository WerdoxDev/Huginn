import { hRateLimit, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

export const postRoamingHuginnClick = new Elysia()
   .use(verifyJwt())
   .use(hRateLimit({ duration: 4000, max: 1 }))
   .post("/api/users/@me/fun/roaming-huginn-click", async ({ tokenPayload, status }) => {
      const userId = BigInt(tokenPayload.id);

      await prisma.userStats.upsert({
         where: { userId },
         create: { userId, roamingHuginnClicks: 1 },
         update: { roamingHuginnClicks: { increment: 1 } },
      });

      return status("No Content");
   });
