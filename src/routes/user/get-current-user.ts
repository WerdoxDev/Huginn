import { DatabaseUser } from "@/src/database";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      console.log(payload.id);

      const user = await DatabaseUser.getUserById(payload.id);

      return c.json(user.toObject(), HttpCode.OK);
   }),
);

export default app;
