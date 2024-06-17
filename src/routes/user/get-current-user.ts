import { prisma } from "@/src/database";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetCurrentUserResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { idFix } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id));

      return c.json(user, HttpCode.OK);
   })
);

export default app;
