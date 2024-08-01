import { prisma } from "@/db";
import { getJwt, handleRequest, verifyJwt } from "@/route-utils";
import { APIGetCurrentUserResult } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const user: APIGetCurrentUserResult = idFix(await prisma.user.getById(payload.id));

      return c.json(user, HttpCode.OK);
   }),
);

export default app;
