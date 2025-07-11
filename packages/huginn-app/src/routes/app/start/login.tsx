import HuginnButton from "@components/button/HuginnButton";
import LinkButton from "@components/button/LinkButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useInitializeClient } from "@hooks/useInitializeClient";
import { useInputs } from "@hooks/useInputs";
import { useOAuth } from "@hooks/useOAuth";
import type { APIPostLoginJSONBody } from "@huginn/shared";
import { useClient } from "@stores/apiStore";
import { useEffect } from "react";
// import { usePostHog } from "posthog-js/react";

export default function Login() {
	// const posthog = usePostHog();
	const client = useClient();
	const initializeClient = useInitializeClient();
	const startBackground = useStartBackground();
	const startOAuth = useOAuth();

	const { inputsProps, values, resetStatuses, handleErrors, validateValues } = useInputs([
		{
			name: "login",
			required: true,
			default: undefined,
		},
		{
			name: "password",
			required: true,
			default: undefined,
		},
	]);

	const mutation = useHuginnMutation(
		{
			async mutationFn(credentials: APIPostLoginJSONBody) {
				await client.login({
					username: credentials.username,
					email: credentials.email,
					password: credentials.password,
				});
			},
			async onSuccess() {
				// setHidden(true);

				// startBackground.setState(1);
				// await initializeClient(undefined, undefined, {
				// 	pathname: "/",
				// 	search: `?${new URLSearchParams({ redirect: "/channels/@me" }).toString()}`,
				// });
				// setHidden(true);
				await initializeClient({
					navigatePath: {
						pathname: "/channels/@me",
					},
				});
				// posthog?.capture("logged_in", null);
			},
		},
		handleErrors,
	);

	useEffect(() => {
		startBackground.setState(0);
	}, []);

	async function login() {
		if (!validateValues()) {
			return;
		}

		await mutation.mutateAsync({
			username: values.login.value,
			email: values.login.value,
			password: values.password.value,
		});

		resetStatuses();
	}

	return (
		<StartWrapper onSubmit={login} transitionName="start-login">
			<div className="flex w-full select-none flex-col items-center">
				<div className="mb-1 font-medium text-2xl text-text">Welcome back!</div>
				<div className="text-text/70">It's very good to see you again!</div>
			</div>
			<div className="mt-5 flex w-full gap-x-2">
				<HuginnButton
					onClick={() => startOAuth("google")}
					type="button"
					innerClassName="flex items-center justify-center gap-x-2"
					className="w-full rounded-lg border-2 border-primary-700 bg-surface-alt py-2 text-text transition-all hover:shadow-lg"
				>
					<IconLogosGoogleIcon className="size-5" />
					<span>Google</span>
				</HuginnButton>
				<HuginnButton
					type="button"
					innerClassName="flex items-center justify-center gap-x-2"
					className="w-full rounded-lg border-2 border-primary-700 bg-surface-alt py-2 text-text transition-all hover:shadow-lg"
				>
					<IconLogosGithubIcon className="size-5 text-white [&>path]:fill-white" />
					<span>GitHub</span>
				</HuginnButton>
			</div>
			<div className="my-7 flex h-0 w-full select-none items-center justify-center border-t border-t-text/25 text-center font-semibold text-text/70 text-xs">
				<span className="bg-surface px-2">or</span>
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

				<LoadingButton loading={!mutation.isIdle && mutation.isPending} className="mt-5 h-10 w-full bg-primary-700" type="submit">
					Login
				</LoadingButton>

				<div className="mt-3 flex select-none items-center">
					<span className="text-sm text-text opacity-70"> Don't have an account? </span>
					<LinkButton to="/register" className="ml-1 text-sm" viewTransition>
						Register
					</LinkButton>
				</div>
			</div>
		</StartWrapper>
	);
}
