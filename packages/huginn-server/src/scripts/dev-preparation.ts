import { prisma } from "@huginn/backend-shared/database";
import { MessageType, UserFlags, WorkerID, snowflake } from "@huginn/shared";

const users = ["user", "user2", "user3", "user4"];

await prisma.message.deleteMany({ where: { author: { username: { in: users } } } });
await prisma.readState.deleteMany({ where: { user: { username: { in: users } } } });
await prisma.channel.deleteMany({ where: { recipients: { every: { username: { in: users } } } } });
await prisma.user.deleteMany({ where: { username: { in: users } } });

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
				password: user,
			},
		}),
	);
}

for (const user of createdUsers) {
	for (const otherUser of createdUsers.filter((x) => x.id !== user.id)) {
		await prisma.relationship.createRelationship(user.id.toString(), otherUser.id.toString());
	}
}

const channel = await prisma.channel.createDM(
	createdUsers[0].id.toString(),
	createdUsers.slice(1).map((x) => x.id.toString()),
);

for (let i = 0; i < 200; i++) {
	await prisma.message.createMessage(
		undefined,
		createdUsers[0].id.toString(),
		channel.id.toString(),
		MessageType.DEFAULT,
		`${i.toString() + " ".repeat(i)}.`,
	);
}

for (const user of createdUsers) {
	await prisma.readState.createState(user.id.toString(), channel.id.toString());
}
