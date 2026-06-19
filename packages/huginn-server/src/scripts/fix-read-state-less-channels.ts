import { prisma } from "@huginn/backend-shared/database/index";

const channels = await prisma.channel.findMany({
   select: { id: true, recipients: { select: { id: true } }, readStates: { select: { userId: true, channelId: true } } },
});

for (const channel of channels) {
   if (channel.recipients.length > channel.readStates.length) {
      const missingUserIds = channel.recipients
         .filter((recipient) => !channel.readStates.some((readState) => readState.userId === recipient.id))
         .map((x) => x.id);

      for (const userId of missingUserIds) {
         console.log(`Creating read state for user ${userId} in channel ${channel.id}`);
         await prisma.readState.createState(userId.toString(), channel.id.toString());
      }
   }
}
