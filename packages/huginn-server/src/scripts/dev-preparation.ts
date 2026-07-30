import { prisma } from "@huginn/backend-shared/database";
import { ChannelType, MessageType, snowflake, UserFlags, WorkerID } from "@huginn/shared";

const users = ["user", "user2", "user3", "user4"];
const internalUsers = ["internal", "internal2"];

await prisma.message.deleteMany({ where: { author: { username: { in: users } } } });
await prisma.readState.deleteMany({ where: { user: { username: { in: users } } } });
await prisma.channel.deleteMany({ where: { recipients: { every: { username: { in: users } } } } });
await prisma.user.deleteMany({ where: { username: { in: users } } });

await prisma.channel.deleteMany({
   where: { recipients: { every: { username: { in: internalUsers } } } },
});
await prisma.user.deleteMany({ where: { username: { in: internalUsers } } });

const createdUsers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
for (const user of users) {
   createdUsers.push(
      await prisma.user.create({
         data: {
            id: snowflake.generate(WorkerID.TESTING),
            email: `${user}@gmail.com`,
            flags: UserFlags.NONE,
            username: user,
            displayName: user,
            password: await Bun.password.hash(user),
            emailVerifiedAt: new Date(),
         },
      }),
   );
}

for (const user of createdUsers) {
   for (const otherUser of createdUsers.filter((x) => x.id !== user.id)) {
      await prisma.relationship.createOne(user.id.toString(), otherUser.id.toString());
   }
}

const channel = await prisma.channel.createDirect(
   createdUsers[0].id.toString(),
   createdUsers.slice(1).map((x) => x.id.toString()),
);

for (let i = 0; i < 200; i++) {
   await prisma.message.createOne({
      authorId: createdUsers[0].id.toString(),
      channelId: channel.id.toString(),
      type: MessageType.DEFAULT,
      content: `${i.toString() + " ".repeat(i)}.`,
   });
}

for (const user of createdUsers) {
   await prisma.readState.createState(user.id.toString(), channel.id.toString());
}

const createdInternalUsers: Awaited<ReturnType<typeof prisma.user.create>>[] = [];
for (const user of internalUsers) {
   // Create internal testing account
   createdInternalUsers.push(
      await prisma.user.create({
         data: {
            id: snowflake.generate(WorkerID.TESTING),
            email: `${user}@gmail.com`,
            flags: UserFlags.NONE,
            username: user,
            displayName: user,
            password: await Bun.password.hash(user),
            system: true,
         },
      }),
   );
}

await prisma.channel.create({
   data: {
      id: snowflake.generate(WorkerID.TESTING),
      type: ChannelType.DM,
      recipients: { connect: createdInternalUsers.map((x) => ({ id: x.id })) },
   },
});

const userIds = createdUsers.map((x) => x.id.toString());
const testChannel = await prisma.channel.createDirect(userIds[0], [userIds[1], userIds[2], userIds[3]], "TESTING", { select: { id: true } });

const testMessages: Parameters<typeof prisma.message.createOne>[0][] = [
   // Day 1 (January 1st) - Initial conversation
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Hey everyone! Happy New Year! 🎉",
      timestamp: new Date(2025, 0, 1, 10, 0), // 10:00 AM
   },
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Happy New Year! Great to be here",
      timestamp: new Date(2025, 0, 1, 10, 2), // 10:02 AM (2 min later - should group)
   },
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Anyone have plans for today?",
      timestamp: new Date(2025, 0, 1, 10, 3), // 10:03 AM (still grouping)
   },
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "I'm thinking of organizing a game night",
      timestamp: new Date(2025, 0, 1, 10, 8), // 10:08 AM (5+ min gap - should separate)
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "That sounds awesome!",
      timestamp: new Date(2025, 0, 1, 10, 9), // 10:09 AM
   },

   // System message: Adding a user
   {
      authorId: userIds[2],
      channelId: testChannel.id.toString(),
      type: MessageType.RECIPIENT_ADD,
      content: "", // System messages typically don't need content
      timestamp: new Date(2025, 0, 1, 10, 15), // 10:15 AM
      mentions: [userIds[3]], // The user being added
   },

   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Thanks for adding me! What's going on?",
      timestamp: new Date(2025, 0, 1, 10, 16), // 10:16 AM
   },
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "We're planning a game night!",
      timestamp: new Date(2025, 0, 1, 10, 17), // 10:17 AM
   },

   // System message: Channel name change
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.CHANNEL_NAME_CHANGED,
      content: "Game Night Planning", // New channel name
      timestamp: new Date(2025, 0, 1, 10, 20), // 10:20 AM
   },

   {
      authorId: userIds[2],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Perfect name! So when should we do this?",
      timestamp: new Date(2025, 0, 1, 10, 25), // 10:25 AM (5+ min gap)
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "How about this Saturday?",
      timestamp: new Date(2025, 0, 1, 10, 26), // 10:26 AM
   },
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Saturday works for me!",
      timestamp: new Date(2025, 0, 1, 10, 27), // 10:27 AM
   },

   // System message: Call started
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.CALL,
      content: "", // Call messages typically don't have content
      timestamp: new Date(2025, 0, 1, 11, 0), // 11:00 AM (30+ min gap)
      call: {
         participants: [userIds[0], userIds[1], userIds[2]],
         endedTimestamp: new Date(2025, 0, 1, 11, 0, 15),
      }, // 15 seconds
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.CALL,
      content: "", // Call messages typically don't have content
      timestamp: new Date(2025, 0, 1, 11, 0), // 11:00 AM (30+ min gap)
      call: {
         participants: [userIds[0], userIds[1], userIds[2]],
         endedTimestamp: new Date(2025, 0, 1, 11, 30),
      }, // 30 minutes
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.CALL,
      content: "", // Call messages typically don't have content
      timestamp: new Date(2025, 0, 1, 11, 0), // 11:00 AM (30+ min gap)
      call: {
         participants: [userIds[0], userIds[1], userIds[2]],
         endedTimestamp: new Date(2025, 0, 1, 13, 0),
      }, // 2 hours
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.CALL,
      content: "", // Call messages typically don't have content
      timestamp: new Date(2025, 0, 1, 13, 0), // 11:00 AM (30+ min gap)
      call: { participants: [userIds[0], userIds[1], userIds[2]] },
   },

   // Day 2 (January 2nd) - New date separator test
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Good morning! Did everyone have fun yesterday?",
      timestamp: new Date(2025, 0, 2, 9, 0), // Next day - 9:00 AM
   },
   {
      authorId: userIds[2],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "The call was great! Thanks for organizing",
      timestamp: new Date(2025, 0, 2, 9, 2), // 9:02 AM
   },

   // System message: Channel icon change
   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.CHANNEL_ICON_CHANGED,
      content: "", // Icon changes typically don't have content
      timestamp: new Date(2025, 0, 2, 9, 10), // 9:10 AM
   },
   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.CHANNEL_ICON_CHANGED,
      content: "", // Icon changes typically don't have content
      timestamp: new Date(2025, 0, 2, 9, 11), // 9:10 AM
   },

   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Nice icon! Really fits the gaming theme",
      timestamp: new Date(2025, 0, 2, 9, 11), // 9:11 AM
   },
   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Thanks! Found it online",
      timestamp: new Date(2025, 0, 2, 9, 12), // 9:12 AM
   },
   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Should we plan another session?",
      timestamp: new Date(2025, 0, 2, 9, 13), // 9:13 AM (grouping test)
   },

   // System message: Owner change
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.CHANNEL_OWNER_CHANGED,
      content: "", // Owner changes typically don't have content
      timestamp: new Date(2025, 0, 2, 9, 20), // 9:20 AM
      mentions: [userIds[2]],
   },

   {
      authorId: userIds[2],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Thanks for making me the owner! I'll take good care of the channel",
      timestamp: new Date(2025, 0, 2, 9, 21), // 9:21 AM
   },

   // System message: Someone leaves
   {
      authorId: userIds[1],
      channelId: testChannel.id.toString(),
      type: MessageType.RECIPIENT_REMOVE,
      content: "", // Leave messages typically don't have content
      timestamp: new Date(2025, 0, 2, 14, 30), // 2:30 PM (large gap)
      mentions: [userIds[1]],
   },

   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Aw, sad to see them go. Hope they come back soon!",
      timestamp: new Date(2025, 0, 2, 14, 35), // 2:35 PM (5+ min gap)
   },

   // Day 3 (January 3rd) - Another date change
   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.CHANNEL_ICON_CHANGED,
      content: "", // Icon changes typically don't have content
      timestamp: new Date(2025, 0, 3, 18, 0), // 9:10 AM
   },
   {
      authorId: userIds[2],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Anyone free this Saturday for another game night?",
      timestamp: new Date(2025, 0, 3, 19, 0), // 7:00 PM next day
   },
   {
      authorId: userIds[3],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "I'm in! Same time as last week?",
      timestamp: new Date(2025, 0, 3, 19, 1), // 7:01 PM
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "Absolutely! Let's make it a weekly thing",
      timestamp: new Date(2025, 0, 3, 19, 10), // 7:10 PM (9+ min gap - should separate)
   },
   {
      authorId: userIds[0],
      channelId: testChannel.id.toString(),
      type: MessageType.DEFAULT,
      content: "I'll set up a recurring reminder",
      timestamp: new Date(2025, 0, 3, 19, 11), // 7:11 PM (should group with previous)
   },
];

for (const messageData of testMessages) {
   await prisma.message.createOne(messageData);
}
