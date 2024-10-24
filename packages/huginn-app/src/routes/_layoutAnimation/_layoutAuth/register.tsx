import type { APIPostRegisterJSONBody } from "@huginn/shared";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/register")({
	beforeLoad({ context: { client } }) {
		requireNotAuth(client);
	},
	component: Register,
	errorComponent: RouteErrorComponent,
});

function Register() {
	const client = useClient();
	const posthog = usePostHog();
	const { inputsProps, values, resetStatuses, handleErrors, validateValues, resetInput } = useInputs([
		{ name: "email", required: true },
		{ name: "displayName", required: false },
		{ name: "username", required: true },
		{ name: "password", required: true },
	]);

	const { setUser } = useUser();

	const [hidden, setHidden] = useState(false);
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
	const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, resetInput, "username");
	const navigate = useNavigate({ from: "/register" });

	const mutation = useHuginnMutation(
		{
			async mutationFn(user: APIPostRegisterJSONBody) {
				await client.register({
					email: user.email,
					displayName: user.displayName,
					username: user.username,
					password: user.password,
				});

				posthog.identify(client.user?.id, { username: client.user?.username, displayName: client.user?.displayName });
				posthog.capture("registered");
			},
			async onSuccess() {
				setAuthBackgroundState(1);
				setHidden(true);

				await client.gateway.connectAndWaitForReady();

				setUser(client.user);

				await navigate({ to: "/channels/@me" });
			},
		},
		handleErrors,
	);

	useEffect(() => {
		setAuthBackgroundState(0);
	}, []);

	async function register() {
		if (!validateValues()) {
			return;
		}

		await mutation.mutateAsync({
			email: values.email.value,
			displayName: values.displayName.value,
			username: values.username.value,
			password: values.password.value,
		});

		resetStatuses();
	}

	function google() {
		const url = new URL("/api/auth/google", client.options.rest?.api);
		url.searchParams.set("redirect_url", window.location.href);
		window.open(url.toString(), "_self");
	}

	return (
		<AuthWrapper hidden={hidden} onSubmit={register}>
			<div className="flex w-full select-none flex-col items-center">
				<h1 className="mb-2 font-medium text-2xl text-text">Welcome to Huginn!</h1>
				<div className="text-text opacity-70">We are very happy to have you here!</div>
			</div>
			<div className="mt-5 flex gap-x-2">
				<button
					onClick={google}
					type="button"
					className="flex items-center justify-center gap-x-2 rounded-lg bg-tertiary p-2 text-text transition-all hover:scale-105 hover:shadow-lg"
				>
					<IconLogosGoogleIcon className="size-6" />
					Google
				</button>
				<button
					type="button"
					className="flex items-center justify-center gap-x-2 rounded-lg bg-tertiary p-2 text-text transition-all hover:scale-105 hover:shadow-lg"
				>
					<IconLogosGithubIcon className="size-6 text-white [&>path]:fill-white" />
					GitHub
				</button>
			</div>
			<div className="mt-5 w-full">
				<HuginnInput className="mb-5" {...inputsProps.email}>
					<HuginnInput.Label text="Email" className="mb-2" />
					<HuginnInput.Wrapper border="left">
						<HuginnInput.Input />
					</HuginnInput.Wrapper>
				</HuginnInput>

				<HuginnInput className="mb-5" {...inputsProps.displayName}>
					<HuginnInput.Label text="Display Name" className="mb-2" />
					<HuginnInput.Wrapper border="left">
						<HuginnInput.Input />
					</HuginnInput.Wrapper>
				</HuginnInput>

				<HuginnInput className="mb-5" onFocusChanged={onFocusChanged} {...inputsProps.username}>
					<HuginnInput.Label text="Username" className="mb-2" />
					<HuginnInput.Wrapper border="left">
						<HuginnInput.Input className="lowercase" />
					</HuginnInput.Wrapper>
					<AnimatedMessage className="mt-1" {...usernameMessageDetail} />
				</HuginnInput>

				<PasswordInput className="mb-5" {...inputsProps.password}>
					<HuginnInput.Label text="Password" className="mb-2" />
					<HuginnInput.Wrapper border="left">
						<HuginnInput.Input />
						<PasswordInput.ToggleButton />
					</HuginnInput.Wrapper>
				</PasswordInput>

				<LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-11 w-full bg-primary" type="submit">
					Register
				</LoadingButton>

				<div className="mt-3 flex select-none items-center">
					<span className="text-sm text-text opacity-70"> Already have an account? </span>
					<LinkButton to="/login" className="ml-1 text-sm" preload={false}>
						Login
					</LinkButton>
				</div>
			</div>
		</AuthWrapper>
	);
}
