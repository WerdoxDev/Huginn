// import { usePostHog } from "posthog-js/react";
import { useClient } from "@contexts/apiContext";
import { useUser } from "@contexts/userContext";
import { useNavigate } from "react-router";

export function useInitializeClient() {
	const client = useClient();
	const { setUser } = useUser();
	const navigate = useNavigate();
	// const posthog = usePostHog();

	async function initialize(token?: string, refreshToken?: string, navigatePath?: string) {
		if (token || refreshToken) {
			await client.initializeWithToken({ token, refreshToken });
		}

		await client.gateway.authenticate();

		setUser(client.user);

		localStorage.setItem("access-token", client.tokenHandler.token ?? "");
		localStorage.setItem("refresh-token", client.tokenHandler.refreshToken ?? "");

		// posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName, email: client.user?.email });

		if (navigatePath) {
			await navigate(navigatePath, { viewTransition: true, replace: true });
		}
	}

	return initialize;
}
