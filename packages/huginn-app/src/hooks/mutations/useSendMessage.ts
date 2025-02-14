import type { AppAttachment, AppChannelMessage } from "@/types";
import { useClient } from "@contexts/apiContext";
import { useEvent } from "@contexts/eventContext";
import { useUser } from "@contexts/userContext";
import { type MessageFlags, pick, snowflake } from "@huginn/shared";
import { type Snowflake, WorkerID } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSendMessage() {
	const client = useClient();
	const { user } = useUser();
	const queryClient = useQueryClient();
	const { dispatchEvent } = useEvent();
	const { setMessageUploadProgress, deleteMessageUploadProgress } = useChannelStore();

	const mutation = useMutation({
		mutationKey: ["send-message"],
		async mutationFn(data: {
			channelId: Snowflake;
			content: string;
			flags: MessageFlags;
			attachments: AppAttachment[];
		}) {
			if (!user) return;

			const nonce = client.generateNonce();

			const previewMessage: AppChannelMessage = {
				preview: true,
				id: snowflake.generateString(WorkerID.APP),
				timestamp: new Date(Date.now()).toISOString(),
				content: data.content,
				channelId: data.channelId,
				author: pick(user, ["id", "avatar", "displayName", "username", "flags"]),
				nonce: nonce,
			};

			const filenames = data.attachments.map((x) => x.filename);

			if (data.attachments.length) {
				setMessageUploadProgress(previewMessage.id, { percentage: 0, filenames, total: 0 });
			}

			// Add Preview Message
			queryClient.setQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", data.channelId], (old) => {
				if (!old) return undefined;

				const lastPage = old.pages[old.pages.length - 1];

				return {
					...old,
					pages: [...old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage, previewMessage])],
				};
			});

			dispatchEvent("message_added", { message: previewMessage, inLoadedQueryPage: true, visible: true, self: true, inVisibleQueryPage: true });

			return {
				previewMessage,
				message: await client.channels.createMessage(
					data.channelId,
					{
						attachments: data.attachments.map((x) => ({ id: x.id, filename: x.filename, description: x.description })),
						content: data.content,
						flags: data.flags,
						nonce: nonce,
					},
					data.attachments.map((x) => ({ data: x.data, name: x.filename, contentType: x.contentType })),
					data.attachments.length
						? (event) =>
								setMessageUploadProgress(previewMessage.id, { percentage: (event.loaded / event.total) * 100, filenames, total: event.total })
						: undefined,
				),
			};
		},
		onSuccess(data, variables, context) {
			if (data?.previewMessage) {
				deleteMessageUploadProgress(data.previewMessage.id);
			}
		},
	});

	return mutation;
}
