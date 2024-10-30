import { ClientReadyState, HuginnAPIError } from "@huginn/api";
import { type APIPostLoginJSONBody, type GatewayOAuthRedirectData, IdentityProviderType } from "@huginn/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UserAttentionType, getCurrentWindow } from "@tauri-apps/api/window";
import { open } from "@tauri-apps/plugin-shell";
import { usePostHog } from "posthog-js/react";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/login")({
	beforeLoad({ context: { client } }) {
		requireNotAuth(client);
	},
	component: Login,
	errorComponent: RouteErrorComponent,
});

function Login() {
	const posthog = usePostHog();
	const client = useClient();
	const appWindow = useWindow();
	const { listenEvent } = useEvent();
	const { inputsProps, values, resetStatuses, handleErrors, validateValues } = useInputs([
		{ name: "login", required: true, default: import.meta.env.DEV ? "test" : undefined },
		{ name: "password", required: true, default: import.meta.env.DEV ? "test" : undefined },
	]);

	const { setUser } = useUser();

	const [hidden, setHidden] = useState(false);
	const [showInitial, setShowInitial] = useState(false);
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
	const navigate = useNavigate({ from: "/login" });

	const handleServerError = useErrorHandler();

	const mutation = useHuginnMutation(
		{
			async mutationFn(credentials: APIPostLoginJSONBody) {
				await client.login({
					username: credentials.username,
					email: credentials.email,
					password: credentials.password,
				});

				posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName });
				posthog?.capture("logged_in", null);
			},
			async onSuccess() {
				setAuthBackgroundState(1);
				setHidden(true);

				await client.gateway.identify();
				await client.gateway.waitForReady();
				setUser(client.user);

				await navigate({ to: "/channels/@me" });

				localStorage.setItem("access-token", client.tokenHandler.token ?? "");
				localStorage.setItem("refresh-token", client.tokenHandler.refreshToken ?? "");
			},
		},
		handleErrors,
	);

	useEffect(() => {
		async function tryLogin() {
			if (client.readyState === ClientReadyState.INITIALIZING) return;

			const refreshToken = localStorage.getItem("refresh-token");
			try {
				if (refreshToken && routeHistory.lastPathname !== "/register") {
					setAuthBackgroundState(1);

					await client.initializeWithToken({ refreshToken });
					await client.gateway.identify();
					await client.gateway.waitForReady();
					setUser(client.user);

					posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName });
					posthog?.capture("logged_in_with_token");

					await navigate({ to: routeHistory.initialPathname === "/login" ? "/channels/@me" : routeHistory.initialPathname });
				} else {
					unhide();
				}
			} catch (e) {
				localStorage.removeItem("refresh-token");
				if (e instanceof HuginnAPIError && e.status >= 500) {
					handleServerError(e);
				}
				await navigate({ to: "/login" });
				unhide();
			}
		}

		function unhide() {
			setShowInitial(true);
			setAuthBackgroundState(0);
		}

		client.gateway.on("oauth_redirect", onOAuthConfirm);

		const unlisten = listenEvent("open_url", async (urls) => {
			const url = new URL(urls[0]);
			await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
			await navigate({ to: `/oauth-redirect?${url.searchParams.toString()}` });
		});

		tryLogin();

		return () => {
			unlisten();
			client.gateway.off("oauth_redirect", onOAuthConfirm);
		};
	}, []);

	async function onOAuthConfirm(d: GatewayOAuthRedirectData) {
		await getCurrentWindow().requestUserAttention(UserAttentionType.Critical);
		await navigate({ to: `/oauth-redirect?${new URLSearchParams({ ...d }).toString()}` });
	}

	async function login() {
		if (!validateValues()) {
			return;
		}

		await mutation.mutateAsync({ username: values.login.value, email: values.login.value, password: values.password.value });

		resetStatuses();
	}

	function google() {
		console.log(appWindow.environment);
		const url = client.oauth.getOAuthURL(
			IdentityProviderType.GOOGLE,
			appWindow.environment === "browser" ? "browser" : "websocket",
			"login",
			"http://localhost:5173/oauth-redirect",
		);

		if (appWindow.environment === "browser") {
			window.open(url, "_self");
		} else {
			open(url);
		}
	}

	return (
		showInitial && (
			<AuthWrapper hidden={hidden} onSubmit={login}>
				<div className="flex w-full select-none flex-col items-center">
					<div className="mb-1 font-medium text-2xl text-text">Welcome back!</div>
					<div className="text-text/70">It's very good to see you again!</div>
				</div>
				<div className="mt-5 flex w-full gap-x-2">
					<HuginnButton
						onClick={google}
						type="button"
						innerClassName="flex items-center justify-center gap-x-2"
						className="w-full rounded-lg border-2 border-accent2 bg-secondary py-2 text-text transition-all hover:shadow-lg"
					>
						<IconLogosGoogleIcon className="size-5" />
						<span>Google</span>
					</HuginnButton>
					<HuginnButton
						type="button"
						innerClassName="flex items-center justify-center gap-x-2"
						className="w-full rounded-lg border-2 border-accent2 bg-secondary py-2 text-text transition-all hover:shadow-lg"
					>
						<IconLogosGithubIcon className="size-5 text-white [&>path]:fill-white" />
						<span>GitHub</span>
					</HuginnButton>
				</div>
				<div className="my-7 flex h-0 w-full select-none items-center justify-center text-center font-semibold text-text/70 text-xs [border-top:thin_solid_rgb(var(--color-text)/0.25)]">
					<span className="bg-background px-2">or</span>
				</div>
				<div className="w-full">
					<HuginnInput className="mb-5" {...inputsProps.login}>
						<HuginnInput.Label className="mb-2" text="Email or Username" />
						<HuginnInput.Wrapper border="left">
							<HuginnInput.Input className="lowercase" />
						</HuginnInput.Wrapper>
					</HuginnInput>

					<PasswordInput {...inputsProps.password}>
						<HuginnInput.Label className="mb-2" text="Password" />
						<HuginnInput.Wrapper border="left">
							<HuginnInput.Input />
							<PasswordInput.ToggleButton />
						</HuginnInput.Wrapper>
					</PasswordInput>

					{/* <LinkButton className="mt-1 mb-5 text-sm">Forgot your password?</LinkButton> */}

					<LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-10 w-full bg-primary mt-5" type="submit">
						Login
					</LoadingButton>

					<div className="mt-3 flex select-none items-center">
						<span className="text-sm text-text opacity-70"> Don't have an account? </span>
						<LinkButton to="/register" className="ml-1 text-sm" preload={false}>
							Register
						</LinkButton>
					</div>
				</div>
			</AuthWrapper>
		)
	);
}
