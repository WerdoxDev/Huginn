import type { APIPostRegisterJSONBody } from "@huginn/shared";
import { createLazyFileRoute } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";

export const Route = createLazyFileRoute("/_layoutAnimation/_layoutAuth/register")({
	component: Register,
	errorComponent: RouteErrorComponent,
});

function Register() {
	const client = useClient();
	const posthog = usePostHog();
	const appWindow = useWindow();
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
	const initializeClient = useInitializeClient();
	const startOAuth = useOAuth();

	const { inputsProps, values, resetStatuses, handleErrors, validateValues, resetInput } = useInputs([
		{ name: "email", required: true },
		{ name: "displayName", required: false },
		{ name: "username", required: true },
		{ name: "password", required: true },
	]);

	const [hidden, setHidden] = useState(false);
	const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, resetInput, "username");

	const mutation = useHuginnMutation(
		{
			async mutationFn(user: APIPostRegisterJSONBody) {
				await client.register({
					email: user.email,
					displayName: user.displayName,
					username: user.username,
					password: user.password,
				});
			},
			async onSuccess() {
				setAuthBackgroundState(1);
				setHidden(true);

				await initializeClient(undefined, undefined, "/channels/@me");
				posthog.capture("registered");
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

	return (
		<AuthWrapper hidden={hidden} onSubmit={register}>
			<div className="flex w-full select-none flex-col items-center">
				<div className="mb-1 font-medium text-2xl text-text">Welcome to Huginn!</div>
				<div className="text-text opacity-70">We are very happy to have you here!</div>
			</div>
			<div className="mt-5 flex w-full gap-x-2">
				<HuginnButton
					onClick={() => startOAuth("google", "register")}
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
				<div className="flex items-end justify-center gap-x-2">
					<HuginnInput onFocusChanged={onFocusChanged} {...inputsProps.username} className="w-1/2">
						<HuginnInput.Label text="Username" className="mb-2" />
						<HuginnInput.Wrapper border="left">
							<HuginnInput.Input className="lowercase" />
						</HuginnInput.Wrapper>
					</HuginnInput>
					<HuginnInput {...inputsProps.displayName} className="w-1/2">
						<HuginnInput.Label text="Display Name" className="mb-2" />
						<HuginnInput.Wrapper border="left">
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
				</div>
				<AnimatedMessage className="mt-1" {...usernameMessageDetail} />

				<HuginnInput className="mt-5 mb-5" {...inputsProps.email}>
					<HuginnInput.Label text="Email" className="mb-2" />
					<HuginnInput.Wrapper border="left">
						<HuginnInput.Input />
					</HuginnInput.Wrapper>
				</HuginnInput>

				<PasswordInput className="mb-5" {...inputsProps.password}>
					<HuginnInput.Label text="Password" className="mb-2" />
					<HuginnInput.Wrapper border="left">
						<HuginnInput.Input />
						<PasswordInput.ToggleButton />
					</HuginnInput.Wrapper>
				</PasswordInput>

				<LoadingButton loading={!mutation.isIdle && mutation.isPending} className="h-10 w-full bg-primary" type="submit">
					Register
				</LoadingButton>

				<div className="mt-3 flex select-none items-center">
					<span className="text-sm text-text opacity-70">Already have an account? </span>
					<LinkButton to="/login" className="ml-1 text-sm" preload={false}>
						Login
					</LinkButton>
				</div>
			</div>
		</AuthWrapper>
	);
}
