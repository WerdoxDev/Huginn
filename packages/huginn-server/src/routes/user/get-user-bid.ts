import { prisma } from "@/db";
import { handleRequest, verifyJwt } from "@/route-utils";
import { APIGetUserByIdResult } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { idFix, omit } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/:userId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const user: APIGetUserByIdResult = idFix(omit(await prisma.user.getById(c.req.param("userId")), ["email"]));

      return c.json(user, HttpCode.OK);
   }),
);

export default app;
