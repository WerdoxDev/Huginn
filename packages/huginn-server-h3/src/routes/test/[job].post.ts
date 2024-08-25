import { HttpCode } from "@huginn/shared";

export default defineEventHandler(async () => {
   const job = getRouterParam(useEvent(), "job");

   const deleteRelationships = prisma.relationship.deleteMany({ where: { owner: { username: { startsWith: "test" } } } });
   const deleteMessages = prisma.message.deleteMany({
      where: { OR: [{ author: { username: { startsWith: "test" } } }, { content: { startsWith: "test" } }] },
   });
   const deleteUsers = prisma.user.deleteMany({ where: { username: { startsWith: "test" } } });
   const deleteChannels = prisma.channel.deleteMany();

   if (job === "test-users") {
      await prisma.$transaction([deleteMessages, deleteRelationships, deleteUsers]);
   }

   if (job === "test-channels") {
      await prisma.$transaction([deleteMessages, deleteChannels]);
   }

   if (job === "test-messages") {
      await prisma.$transaction([deleteMessages]);
   }

   if (job === "test-relationships") {
      await prisma.$transaction([deleteRelationships]);
   }

   if (job === "conversation-messages") {
      await prisma.message.deleteMany();
   }

   return sendNoContent(useEvent(), HttpCode.OK);
});
