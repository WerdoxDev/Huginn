import { HttpCode } from "@huginn/shared";
import { defineEventHandler, getRouterParam, sendNoContent } from "h3";
import { router } from "#server";
import { prisma } from "#database";

router.post(
	"/test/:job",
	defineEventHandler(async (event) => {
		const job = getRouterParam(event, "job");

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

		return sendNoContent(event, HttpCode.OK);
	}),
);
