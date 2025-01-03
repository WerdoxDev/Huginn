import type { APIPostOAuthConfirmJSONBody, IdentityTokenPayload } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";
import * as jose from "jose";
import { redirect, useNavigate, useSearchParams } from "react-router";

export default function Component() {
	const client = useClient();
	const { listenEvent } = useEvent();
	const [search] = useSearchParams();
	const navigate = useNavigate();
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
	const modalsDispatch = useModalsDispatch();
	const initializeClient = useInitializeClient();
	const history = useHistory();

	const decodedToken = useMemo(
		() => (search.get("token") ? (jose.decodeJwt(search.get("token") ?? "") as IdentityTokenPayload) : undefined),
		[search],
	);

	const { inputsProps, values, handleErrors, resetInput } = useInputs([
		{ name: "username", required: true, default: decodedToken?.username },
		{ name: "displayName", required: false, default: decodedToken?.fullName },
	]);

	const [hidden, setHidden] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);
	const { data: originalAvatar } = useQuery(getUserAvatarOptions(decodedToken?.providerUserId, decodedToken?.avatarHash, client));
	const [avatarData, setAvatarData] = useState<string | null>(null);
	const { message: usernameMessageDetail, onFocusChanged } = useUniqueUsernameMessage(values, resetInput, "username");

	const mutation = useHuginnMutation(
		{
			async mutationFn(body: APIPostOAuthConfirmJSONBody) {
				if (search.get("token")) {
					return await client.oauth.confirmOAuth(body, search.get("token") ?? "");
				}
			},
			async onSuccess(data) {
				setAuthBackgroundState(1);
				setHidden(true);

				await initializeClient(data?.token, data?.refreshToken, "/channels/@me");
			},
		},
		handleErrors,
	);

	useEffect(() => {
		async function tryAuthorize() {
			if (search.has("access_token") || search.has("refresh_token")) {
				try {
					setAuthBackgroundState(1);

					await initializeClient(search.get("access_token") ?? "", search.get("refresh_token") ?? "", "/channels/@me");
				} catch (e) {
					console.log(e);
					await navigate("/");
				}
			} else {
				setShouldRender(true);
				setAuthBackgroundState(0);
			}
		}

		const unlisten = listenEvent("image_cropper_done", (e) => {
			setAvatarData(e.croppedImageData);
		});

		modalsDispatch({ info: { isOpen: false } });
		tryAuthorize();

		return () => {
			unlisten();
		};
	}, []);

	useEffect(() => {
		if (originalAvatar !== undefined) {
			setAvatarData(originalAvatar);
		}
	}, [originalAvatar]);

	function onDelete() {
		if (avatarData) {
			setAvatarData(null);
		}
	}

	function onSelected(data: string, mimeType: string) {
		modalsDispatch({
			imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType },
		});
	}

	async function abort() {
		await navigate(history.lastPathname ?? "/", { viewTransition: true });
	}

	async function confirm() {
		await mutation.mutateAsync({
			avatar: avatarData,
			displayName: values.displayName.value,
			username: values.username.value,
		});
	}

	return (
		shouldRender && (
			<AuthWrapper hidden={hidden} transitionName="auth-oauth-redirect">
				{search.has("token") && (
					<>
						<div className="flex w-full select-none flex-col items-center">
							<div className="mb-1 font-medium text-2xl text-text">Almost there!</div>
							<div className="text-center text-text opacity-70">Finish creating your account and enjoy Huginn!</div>
						</div>
						<div className="-left-40 absolute inset-y-0 flex items-center ">
							<ImageSelector
								data={avatarData}
								onDelete={onDelete}
								onSelected={onSelected}
								size="7.5rem"
								className="!bg-background shadow-xl transition-shadow group-hover/wrapper:shadow-2xl"
								editButtonClassName="bg-secondary"
							/>
						</div>
						<div className="mt-5 flex w-full flex-col">
							<HuginnInput {...inputsProps.username} onFocusChanged={onFocusChanged} className="mb-5">
								<HuginnInput.Label text="Username" className="mb-2" />
								<HuginnInput.Wrapper border="left">
									<HuginnInput.Input className="lowercase" />
								</HuginnInput.Wrapper>
								<AnimatedMessage className="mt-1" {...usernameMessageDetail} />
							</HuginnInput>

							<HuginnInput placeholder={decodedToken?.username} {...inputsProps.displayName}>
								<HuginnInput.Label text="Display Name" className="mb-2" />
								<HuginnInput.Wrapper border="left">
									<HuginnInput.Input />
								</HuginnInput.Wrapper>
							</HuginnInput>
						</div>
						<div className="mt-5 flex w-full gap-x-2">
							<HuginnButton className="w-full bg-secondary" onClick={abort}>
								Abort
							</HuginnButton>
							<LoadingButton
								onClick={confirm}
								loading={!mutation.isIdle && mutation.isPending}
								className="h-10 w-full bg-primary"
								type="submit"
							>
								Confirm
							</LoadingButton>
						</div>
					</>
				)}
			</AuthWrapper>
		)
	);
}
