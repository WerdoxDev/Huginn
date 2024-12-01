import { createErrorFactory, createHuginnError, useValidatedBody } from "@huginn/backend-shared";
import { invalidFormBody } from "@huginn/backend-shared";
import { type APIPostDMChannelResult, ChannelType, Errors, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { includeChannelRecipients } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { channelWithoutRecipient } from "#utils/helpers";
import { useVerifiedJwt } from "#utils/route-utils";
import { validateChannelName } from "#utils/validation";

const schema = z.object({ name: z.optional(z.string()), recipients: z.array(z.string()).min(1) });

router.post(
	"/users/@me/channels",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const body = await useValidatedBody(event, schema);

		// if (body.recipients.length === 0) {
		// 	return invalidFormBody(event);
		// }

		const formError = createErrorFactory(Errors.invalidFormBody());

		validateChannelName(body.name, formError);

		if (formError.hasErrors()) {
			return createHuginnError(event, formError);
		}

		// Create dm
		const createdChannel: APIPostDMChannelResult = idFix(
			await prisma.channel.createDM(payload.id, body.recipients, body.name, includeChannelRecipients),
		);

		// Subscribe topics, dispatch channel create event, create read state
		for (const recipientId of [...createdChannel.recipients.map((x) => x.id)]) {
			const channel: APIPostDMChannelResult = { ...createdChannel, recipients: createdChannel.recipients.filter((x) => x.id !== recipientId) };
			gateway.subscribeSessionsToTopic(recipientId, createdChannel.id);

			if (channel.type === ChannelType.GROUP_DM || recipientId === payload.id) {
				dispatchToTopic(recipientId, "channel_create", channel);
			}

			// TODO: OPTIMIZE THIS: This can be a single query call with createMany
			await prisma.readState.createState(recipientId, createdChannel.id);
		}

		setResponseStatus(event, HttpCode.CREATED);
		return channelWithoutRecipient(createdChannel, payload.id) as APIPostDMChannelResult;
	}),
);
