import { UserFlags, WorkerID, snowflake } from "@huginn/shared";
import { prisma } from "#database";

const users = ["test", "test2", "test3", "test4"];

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

await prisma.channel.createDM(
	createdUsers[0].id.toString(),
	createdUsers.slice(1).map((x) => x.id.toString()),
);
