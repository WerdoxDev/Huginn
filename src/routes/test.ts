import { HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { prisma } from "../database";
// import { Channel } from "../database/schemas/channel-schema";
// import { Message } from "../database/schemas/message-schema";
// import { User } from "../database/schemas/user-schema";

const app = new Hono();

app.post("/test/:job", async c => {
   if (c.req.param("job") === "test-users") {
      await prisma.user.deleteMany({ where: { username: { startsWith: "test" } } });
   }

   if (c.req.param("job") === "test-channels") {
      await prisma.channel.deleteMany();
   }

   if (c.req.param("job") === "test-messages") {
      await prisma.message.deleteMany({ where: { content: { startsWith: "test" } } });
   }

   return c.text("", HttpCode.OK);
});

export default app;
