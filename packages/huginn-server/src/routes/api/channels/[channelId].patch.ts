import { createErrorFactory, createHuginnError, invalidFormBody, unauthorized, useValidatedBody, useValidatedParams } from "@huginn/backend-shared";
import { CDNRoutes, Errors, HttpCode, idFix, merge, resolveBuffer } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { excludeSelfChannelUser, includeChannelRecipients } from "#database/common";
import { router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { getFileHash, useVerifiedJwt } from "#utils/route-utils";
import { cdnUpload } from "#utils/server-request";
import { validateChannelName } from "#utils/validation";

const schema = z.object({
	name: z.optional(z.nullable(z.string())),
	icon: z.optional(z.nullable(z.string())),
	recipients: z.optional(z.array(z.string())),
});

const paramsSchema = z.object({ channelId: z.string() });

router.patch(
	"/channels/:channelId",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const { channelId } = await useValidatedParams(event, paramsSchema);
		const body = await useValidatedBody(event, schema);

		if (!(await prisma.channel.exists({ ownerId: BigInt(payload.id) }))) {
			return unauthorized(event);
		}

		const formError = createErrorFactory(Errors.invalidFormBody());

		validateChannelName(body.name, formError);

		if (formError.hasErrors()) {
			return createHuginnError(event, formError);
		}

		if (body.recipients?.length === 0) {
			return invalidFormBody(event);
		}

		let channelIconHash: string | undefined | null = undefined;
		if (body.icon !== null && body.icon !== undefined) {
			const data = resolveBuffer(body.icon);
			channelIconHash = getFileHash(data);

			channelIconHash = (
				await cdnUpload<string>(CDNRoutes.uploadChannelIcon(channelId), {
					files: [{ data: data, name: channelIconHash }],
				})
			).split(".")[0];
		} else if (body.icon === null) {
			channelIconHash = null;
		}

		const updatedChannel = idFix(
			await prisma.channel.editDM(
				payload.id,
				channelId,
				{ name: body.name, icon: channelIconHash, recipients: body.recipients },
				merge(includeChannelRecipients, excludeSelfChannelUser(payload.id)),
			),
		);

		dispatchToTopic(channelId, "channel_update", updatedChannel);

		setResponseStatus(event, HttpCode.OK);
		return updatedChannel;
	}),
);
