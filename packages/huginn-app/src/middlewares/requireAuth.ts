import type { HuginnClient } from "@huginn/api";
import { redirect } from "@tanstack/react-router";

export function requireAuth(client: HuginnClient) {
	if (!client.isLoggedIn) {
		throw redirect({ to: "/login" });
	}
}
