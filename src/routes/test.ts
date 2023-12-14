import Elysia from "elysia";
import { HttpCode } from "@shared/errors";
import { Channel } from "../database/schemas/channel-schema";
import { User } from "../database/schemas/user-schema";
import { setup } from "../route-utils";
import { Message } from "../database/schemas/message-schema";

const route = new Elysia().use(setup);

route.post("/test/:job", async (ctx) => {
   if (ctx.params.job === "test-users") {
      await User.deleteMany({ username: { $regex: "test" } }).exec();
   }

   if (ctx.params.job === "test-channels") {
      await Channel.deleteMany({}).exec();
   }

   if (ctx.params.job === "test-messages") {
      await Message.deleteMany({ content: { $regex: "test" } }).exec();
   }

   ctx.set.status = HttpCode.OK;
});

export default route;
