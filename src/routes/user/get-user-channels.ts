import { DatabaseChannel } from "@/src/database/database-channel";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/channels", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const channels = await DatabaseChannel.getUserChannels(payload!.id);
      console.log(channels);

      return c.json(channels, HttpCode.OK);
   }),
);

export default app;
