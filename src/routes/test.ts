import { HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { Channel } from "../database/schemas/channel-schema";
import { Message } from "../database/schemas/message-schema";
import { User } from "../database/schemas/user-schema";

const app = new Hono();

app.post("/test/:job", async c => {
   if (c.req.param("job") === "test-users") {
      await User.deleteMany({ username: { $regex: "test" } }).exec();
   }

   if (c.req.param("job") === "test-channels") {
      await Channel.deleteMany({}).exec();
   }

   if (c.req.param("job") === "test-messages") {
      await Message.deleteMany({ content: { $regex: "test" } }).exec();
   }

   return c.text("", HttpCode.OK);
});

export default app;
