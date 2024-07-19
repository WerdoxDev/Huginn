import { HttpCode } from "@huginn/shared";
import { Hono } from "hono";
import { prisma } from "../db";
import { handleRequest } from "../route-utils";
// import { Channel } from "../database/schemas/channel-schema";
// import { Message } from "../database/schemas/message-schema";
// import { User } from "../database/schemas/user-schema";

const app = new Hono();

app.post("/test/:job", c =>
   handleRequest(c, async () => {
      const deleteRelationships = prisma.relationship.deleteMany({ where: { owner: { username: { startsWith: "test" } } } });
      const deleteMessages = prisma.message.deleteMany({
         where: { OR: [{ author: { username: { startsWith: "test" } } }, { content: { startsWith: "test" } }] },
      });
      const deleteUsers = prisma.user.deleteMany({ where: { username: { startsWith: "test" } } });
      const deleteChannels = prisma.channel.deleteMany();

      if (c.req.param("job") === "test-users") {
         await prisma.$transaction([deleteMessages, deleteRelationships, deleteUsers]);
      }

      if (c.req.param("job") === "test-channels") {
         await prisma.$transaction([deleteMessages, deleteChannels]);
      }

      if (c.req.param("job") === "test-messages") {
         await prisma.$transaction([deleteMessages]);
      }

      if (c.req.param("job") === "test-relationships") {
         await prisma.$transaction([deleteRelationships]);
      }

      if (c.req.param("job") === "conversation-messages") {
         await prisma.message.deleteMany();
      }

      return c.text("", HttpCode.OK);
   }),
);

export default app;
