import { createErrorFactory, createHuginnError, useValidatedBody } from "@huginn/backend-shared";
import { invalidFormBody } from "@huginn/backend-shared";
import { type APIPostDMChannelResult, ChannelType, Errors, HttpCode, idFix, merge } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { excludeChannelRecipient, includeChannelRecipients } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";
import { validateChannelName } from "#utils/validation";

const schema = z.object({ name: z.optional(z.string()), recipients: z.array(z.string()) });

router.post(
	"/users/@me/channels",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const body = await useValidatedBody(event, schema);

		if (body.recipients.length === 0) {
			return invalidFormBody(event);
		}

		const formError = createErrorFactory(Errors.invalidFormBody());

		validateChannelName(body.name, formError);

		if (formError.hasErrors()) {
			return createHuginnError(event, formError);
		}

		const createdChannel: APIPostDMChannelResult = idFix(
			await prisma.channel.createDM(payload.id, body.recipients, body.name, includeChannelRecipients),
		);

		for (const id of [payload.id, ...body.recipients]) {
			const channel: APIPostDMChannelResult = { ...createdChannel, recipients: createdChannel.recipients.filter((x) => x.id !== id) };
			gateway.subscribeSessionsToTopic(id, createdChannel.id);

			if (channel.type === ChannelType.GROUP_DM || id === payload.id) {
				dispatchToTopic(id, "channel_create", channel);
			}
		}

		setResponseStatus(event, HttpCode.CREATED);
		return { ...createdChannel, recipients: createdChannel.recipients.filter((x) => x.id !== payload.id) } as APIPostDMChannelResult;
	}),
);
