import AuthWrapper from "@components/AuthWrapper";
import RouteErrorComponent from "@components/RouteErrorComponent";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import { useClient } from "@contexts/apiContext";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext";
import { routeHistory } from "@contexts/historyContext";
import { useUser } from "@contexts/userContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInputs } from "@hooks/useInputs";
import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { ClientReadyState, HuginnAPIError } from "@huginn/api";
import type { APIPostLoginJSONBody } from "@huginn/shared";
import { requireNotAuth } from "@lib/middlewares";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useContext, useEffect, useState } from "react";

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
	const { inputsProps, values, resetStatuses, handleErrors } = useInputs([
		{ name: "login", required: true, default: "test" },
		{ name: "password", required: true, default: "test" },
	]);

	const { setUser } = useUser();

	const [hidden, setHidden] = useState(true);
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

				await client.gateway.connectAndWaitForReady();
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
					setHidden(true);

					await client.initializeWithToken({ refreshToken });
					await client.gateway.connectAndWaitForReady();

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
			setHidden(false);
			setAuthBackgroundState(0);
		}

		tryLogin();
	}, []);

	async function login() {
		await mutation.mutateAsync({ username: values.login.value, email: values.login.value, password: values.password.value });

		resetStatuses();
	}

	return (
		<AuthWrapper hidden={hidden} onSubmit={login}>
			<div className="flex w-full select-none flex-col items-center">
				<h1 className="mb-2 font-medium text-2xl text-text">Welcome back!</h1>
				<div className="text-text/70">It's very good to see you again!</div>
			</div>
			<div className="mt-5 w-full">
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

				<LinkButton className="mt-1 mb-5 text-sm">Forgot your password?</LinkButton>

				<LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-11 w-full bg-primary " type="submit">
					Log In
				</LoadingButton>

				<div className="mt-3 flex select-none items-center">
					<span className="text-sm text-text opacity-70"> Don't have an account? </span>
					<LinkButton to="/register" className="ml-1 text-sm" preload={false}>
						Register
					</LinkButton>
				</div>
			</div>
		</AuthWrapper>
	);
}
