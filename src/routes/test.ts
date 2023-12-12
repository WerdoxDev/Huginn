import Elysia from "elysia";
import { setup } from "../route-utils";
import { HttpCode } from "@shared/errors";
import { Channel } from "../database/channel-schema";
import { User } from "../database/user-schema";

const route = new Elysia().use(setup);

route.post("/test/:job", async (ctx) => {
   if (ctx.params.job === "test-users") {
      await User.deleteMany({ username: { $regex: "test" } }).exec();
   }

   if (ctx.params.job === "test-channels") {
      await Channel.deleteMany({}).exec();
   }

   ctx.set.status = HttpCode.OK;
});

export default route;
