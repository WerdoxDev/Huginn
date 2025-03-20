import { createErrorFactory, createHuginnError, createRoute, validator } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectChannelRecipients } from "@huginn/backend-shared/database/common";
import { type APIPostDMChannelResult, ChannelType, Errors, HttpCode, idFix } from "@huginn/shared";
import { z } from "zod";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { channelWithoutRecipient } from "#utils/helpers";
import { verifyJwt } from "#utils/route-utils";
import { validateChannelName } from "#utils/validation";

const schema = z.object({ name: z.optional(z.string()), recipients: z.array(z.string()).nonempty() });

createRoute("POST", "/api/users/@me/channels", verifyJwt(), validator("json", schema), async (c) => {
	const payload = c.get("tokenPayload");
	const body = c.req.valid("json");

	const formError = createErrorFactory(Errors.invalidFormBody());

	validateChannelName(body.name, formError);

	if (formError.hasErrors()) {
		return createHuginnError(c, formError);
	}

	// Create dm
	const createdChannel: APIPostDMChannelResult = idFix(
		await prisma.channel.createDM(payload.id, body.recipients, body.name, { include: selectChannelRecipients }),
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

	return c.json(channelWithoutRecipient(createdChannel, payload.id) as APIPostDMChannelResult, HttpCode.CREATED);
});
