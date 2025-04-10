import type { GatewayOAuthRedirectData, OAuthType } from "@huginn/shared";
import { listenEvent } from "@lib/eventHandler";
import { useClient } from "@stores/apiStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export function useOAuth() {
	const client = useClient();
	const navigate = useNavigate();
	const huginnWindow = useHuginnWindow();
	const { updateModals } = useModals();

	let unlisten: () => void;

	// Websocket

	function startOAuth(type: OAuthType) {
		listenOAuth();
		const url = client.oauth.getOAuthURL(type, huginnWindow.environment === "browser" ? "browser" : "websocket", `${window.origin}/oauth-redirect`);

		if (huginnWindow.environment === "browser") {
			window.open(url, "_self");
		} else {
			updateModals({
				info: {
					status: "default",
					isOpen: true,
					title: "Check your browser!",
					text: "Please check your browser and continue there",
					closable: false,
					action: {
						cancel: {
							text: "Cancel",
							callback: () => {
								updateModals({ info: { isOpen: false } });
								unlistenOAuth();
							},
						},
					},
				},
			});
			open(url);
		}
	}

	async function onOAuthRedirect(d: GatewayOAuthRedirectData) {
		//TODO: MIGRATION
		// await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
		await navigate(`/oauth-redirect?${new URLSearchParams({ ...d }).toString()}`, { viewTransition: true });
		unlistenOAuth();
	}

	function listenOAuth() {
		unlistenOAuth();
		client.gateway.on("oauth_redirect", onOAuthRedirect, true);

		// Url scheme
		unlisten = listenEvent("open_url", async (urls) => {
			const url = new URL(urls[0]);
			//TODO: MIGRATION
			// await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
			await navigate(`/oauth-redirect?${url.searchParams.toString()}`, { viewTransition: true });
			unlistenOAuth();
		});
	}

	useEffect(() => {
		return () => {
			unlistenOAuth();
		};
	}, []);

	function unlistenOAuth() {
		unlisten?.();
		client.gateway.off("oauth_redirect", onOAuthRedirect);
	}

	return startOAuth;
}
