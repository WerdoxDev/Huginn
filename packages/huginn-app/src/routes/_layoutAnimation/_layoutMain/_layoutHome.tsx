import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome")({
	beforeLoad({ context: { client } }) {
		requireAuth(client);
	},
	loader: async ({ context: { queryClient, client } }) => {
		return await queryClient.ensureQueryData(getChannelsOptions(client, "@me"));
	},
	gcTime: 0,
});
