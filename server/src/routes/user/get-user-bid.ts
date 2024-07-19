import { prisma } from "@/src/db";
import { handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserByIdResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { idFix, omit } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/:userId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const user: APIGetUserByIdResult = idFix(omit(await prisma.user.getById(c.req.param("userId")), ["email"]));

      return c.json(user, HttpCode.OK);
   })
);

export default app;
