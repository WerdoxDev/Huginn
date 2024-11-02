import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
	loader: async ({ params, context: { queryClient, client } }) => {
		return (
			queryClient.getQueryData(getMessagesOptions(queryClient, client, params.channelId).queryKey) ??
			(await queryClient.fetchInfiniteQuery(getMessagesOptions(queryClient, client, params.channelId)))
		);
	},
	gcTime: 0,
});
