import { HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { prisma } from "../database";
// import { Channel } from "../database/schemas/channel-schema";
// import { Message } from "../database/schemas/message-schema";
// import { User } from "../database/schemas/user-schema";

const app = new Hono();

app.post("/test/:job", async c => {
   if (c.req.param("job") === "test-users") {
      const deleteMessages = prisma.message.deleteMany({ where: { author: { username: { startsWith: "test" } } } });
      const deleteUsers = prisma.user.deleteMany({ where: { username: { startsWith: "test" } } });

      await prisma.$transaction([deleteMessages, deleteUsers]);
   }

   if (c.req.param("job") === "test-channels") {
      const deleteMessages = prisma.message.deleteMany();
      const deleteChannels = prisma.channel.deleteMany();

      await prisma.$transaction([deleteMessages, deleteChannels]);
   }

   if (c.req.param("job") === "test-messages") {
      await prisma.message.deleteMany({ where: { content: { startsWith: "test" } } });
   }

   return c.text("", HttpCode.OK);
});

export default app;
