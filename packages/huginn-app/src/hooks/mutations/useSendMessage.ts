import type { AppChannelMessage } from "@/types";
import { type MessageFlags, pick, snowflake } from "@huginn/shared";
import { type Snowflake, WorkerID } from "@huginn/shared";
import { type InfiniteData, useMutation, useQueryClient } from "@tanstack/react-query";

export function useSendMessage() {
	const client = useClient();
	const { user } = useUser();
	const queryClient = useQueryClient();
	const { dispatchEvent } = useEvent();

	const mutation = useMutation({
		mutationKey: ["send-message"],
		async mutationFn(data: { channelId: Snowflake; content: string; flags: MessageFlags }) {
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

			dispatchEvent("message_added", { message: previewMessage, inLoadedQueryPage: true, visible: true, self: true, inVisibleQueryPage: true });

			// Add Preview Message
			queryClient.setQueryData<InfiniteData<AppChannelMessage[], { before: string; after: string }>>(["messages", data.channelId], (old) => {
				if (!old) return undefined;

				const lastPage = old.pages[old.pages.length - 1];

				return {
					...old,
					pages: [...old.pages.toSpliced(old.pages.length - 1, 1, [...lastPage, previewMessage])],
				};
			});

			return await client.channels.createMessage(data.channelId, {
				content: data.content,
				flags: data.flags,
				nonce: nonce,
			});
		},
	});

	return mutation;
}
