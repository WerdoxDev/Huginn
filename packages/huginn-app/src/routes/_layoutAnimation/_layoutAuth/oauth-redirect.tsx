import { createFileRoute } from "@tanstack/react-router";

type Search = {
	token?: string;
	error?: string;
	access_token?: string;
	refresh_token?: string;
};

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/oauth-redirect")({
	validateSearch: (search: Record<string, string>): Search => {
		return { token: search.token, error: search.error };
	},
});
