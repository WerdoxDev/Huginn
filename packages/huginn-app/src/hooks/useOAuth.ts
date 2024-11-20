import type { GatewayOAuthRedirectData, OAuthAction, OAuthType } from "@huginn/shared";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { UserAttentionType, getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-shell";
import { useNavigate } from "react-router";

export function useOAuth() {
	const client = useClient();
	const navigate = useNavigate();
	const appWindow = useWindow();
	const { listenEvent } = useEvent();
	const modalsDispatch = useModalsDispatch();

	let unlisten: UnlistenFn;

	// Websocket

	function startOAuth(type: OAuthType, action: OAuthAction) {
		listenOAuth();
		const url = client.oauth.getOAuthURL(
			type,
			appWindow.environment === "browser" ? "browser" : "websocket",
			action,
			`${window.origin}/oauth-redirect`,
		);

		if (appWindow.environment === "browser") {
			window.open(url, "_self");
		} else {
			modalsDispatch({
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
								modalsDispatch({ info: { isOpen: false } });
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
		await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
		await navigate(`/oauth-redirect?${new URLSearchParams({ ...d }).toString()}`, { viewTransition: true });
		unlistenOAuth();
	}

	function listenOAuth() {
		unlistenOAuth();
		client.gateway.on("oauth_redirect", onOAuthRedirect, true);

		// Url scheme
		unlisten = listenEvent("open_url", async (urls) => {
			const url = new URL(urls[0]);
			await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
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
