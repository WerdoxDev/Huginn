import { ClientReadyState } from "@huginn/api";
import { type APIPostLoginJSONBody, HuginnAPIError } from "@huginn/shared";
// import { usePostHog } from "posthog-js/react";
import { redirect, useNavigate, useSearchParams } from "react-router";

export default function Login() {
	// const posthog = usePostHog();
	const client = useClient();
	const handleServerError = useErrorHandler();
	const initializeClient = useInitializeClient();
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
	const navigate = useNavigate();
	const [search] = useSearchParams();
	const startOAuth = useOAuth();
	const history = useHistory();

	const { inputsProps, values, resetStatuses, handleErrors, validateValues } = useInputs([
		{
			name: "login",
			required: true,
			default: import.meta.env.DEV ? "user" : undefined,
		},
		{
			name: "password",
			required: true,
			default: import.meta.env.DEV ? "user" : undefined,
		},
	]);

	const [hidden, setHidden] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);

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
				setAuthBackgroundState(1);
				setHidden(true);

				await initializeClient(undefined, undefined, "/channels/@me");
				// posthog?.capture("logged_in", null);
			},
		},
		handleErrors,
	);

	useEffect(() => {
		async function tryLogin() {
			if (client.readyState === ClientReadyState.INITIALIZING) return;

			const refreshToken = localStorage.getItem("refresh-token");
			try {
				if (refreshToken && history.lastPathname !== "/register") {
					setAuthBackgroundState(1);

					await initializeClient(undefined, refreshToken, search.get("redirect") ?? "/channels/@me");

					// posthog?.capture("logged_in_with_token");
				} else {
					unhide();
				}
			} catch (e) {
				localStorage.removeItem("refresh-token");
				if (e instanceof HuginnAPIError && e.status >= 500) {
					handleServerError(e);
				}
				await navigate("/login", { viewTransition: true });
				unhide();
			}
		}

		function unhide() {
			setShouldRender(true);
			setAuthBackgroundState(0);
		}

		tryLogin();
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
		shouldRender && (
			<AuthWrapper hidden={hidden} onSubmit={login} transitionName="auth-login">
				<div className="flex w-full select-none flex-col items-center">
					<div className="mb-1 font-medium text-2xl text-text">Welcome back!</div>
					<div className="text-text/70">It's very good to see you again!</div>
				</div>
				<div className="mt-5 flex w-full gap-x-2">
					<HuginnButton
						onClick={() => startOAuth("google")}
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

					<LoadingButton loading={!mutation.isIdle && mutation.isPending} className="mt-5 h-10 w-full bg-primary" type="submit">
						Login
					</LoadingButton>

					<div className="mt-3 flex select-none items-center">
						<span className="text-sm text-text opacity-70"> Don't have an account? </span>
						<LinkButton to="/register" className="ml-1 text-sm" viewTransition>
							Register
						</LinkButton>
					</div>
				</div>
			</AuthWrapper>
		)
	);
}
