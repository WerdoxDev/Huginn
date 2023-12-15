import { DatabaseChannel } from "@/src/database/database-channel";
import { verifyJwt, handleRequest, getJwt } from "@/src/route-utils";
import { APIGetUserChannelsResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/channels", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const channels = await DatabaseChannel.getUserChannels(payload!.id);
      const json: APIGetUserChannelsResult = channels.map(x => x.toObject());

      return c.json(json, HttpCode.OK);
   }),
);

export default app;
