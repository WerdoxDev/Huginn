import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/friends")({
	beforeLoad({ context: { client } }) {
		requireAuth(client);
	},
	loader({ context: { queryClient, client } }) {
		return queryClient.ensureQueryData(getRelationshipsOptions(client));
	},
	gcTime: 0,
});
