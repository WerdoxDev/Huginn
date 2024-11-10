import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/register")({
	beforeLoad({ context: { client } }) {
		requireNotAuth(client);
	},
});
