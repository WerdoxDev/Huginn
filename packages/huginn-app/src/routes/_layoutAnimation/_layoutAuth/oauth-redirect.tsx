import { type APIPostOAuthConfirmJSONBody, FieldCode, type IdentityTokenPayload, OAuthCode } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as jose from "jose";

type Search = {
	token?: string;
	error?: string;
	access_token?: string;
	refresh_token?: string;
};

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/oauth-redirect")({
	validateSearch: (search: Record<string, string>): Search => {
		return { token: search.token, error: search.error };
	},
	component: OAuthConfirm,
});

function OAuthConfirm() {
	const client = useClient();
	const { listenEvent } = useEvent();
	const search = Route.useSearch();
	const navigate = useNavigate();
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);
	const modalsDispatch = useModalsDispatch();

	const decodedToken = useMemo(() => (search.token ? (jose.decodeJwt(search.token) as IdentityTokenPayload) : undefined), [search]);

	const errorText = useMemo(
		() =>
			search.error === OAuthCode.EMAIL_EXISTS
				? "An account with that email address already exists!"
				: search.error === OAuthCode.NOT_FOUND
					? "No user was found!"
					: "Unknown Error",
		[search],
	);

	const { inputsProps, values, handleErrors, resetInput } = useInputs([
		{ name: "username", required: true, default: decodedToken?.username },
		{ name: "displayName", required: false, default: decodedToken?.fullName },
	]);

	const [hidden, setHidden] = useState(false);
	const [showInitial, setShowInitial] = useState(false);
	const { data: originalAvatar } = useQuery(getUserAvatar(decodedToken?.providerUserId, decodedToken?.avatarHash, client));
	const [avatarData, setAvatarData] = useState<string | null>(null);
	const { message: usernameMessageDetail, onFocusChanged, onChanged } = useUniqueUsernameMessage(values, resetInput, "username");

	const { setUser } = useUser();

	const mutation = useHuginnMutation(
		{
			async mutationFn(body: APIPostOAuthConfirmJSONBody) {
				if (search.token) {
					return await client.oauth.confirmOAuth(body, search.token);
				}
			},
			async onSuccess(data) {
				setAuthBackgroundState(1);
				setHidden(true);

				await client.initializeWithToken({
					token: data?.token,
					refreshToken: data?.refreshToken,
				});
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
		async function tryAuthorize() {
			if (search.access_token || search.refresh_token) {
				try {
					setAuthBackgroundState(1);

					await client.initializeWithToken({ token: search.access_token, refreshToken: search.refresh_token });
					await client.gateway.identify();
					await client.gateway.waitForReady();
					setUser(client.user);

					await navigate({ to: "/channels/@me" });

					localStorage.setItem("access-token", client.tokenHandler.token ?? "");
					localStorage.setItem("refresh-token", client.tokenHandler.refreshToken ?? "");
				} catch (e) {
					console.log(e);
					await navigate({ to: "/login" });
				}
			} else {
				setShowInitial(true);
				setAuthBackgroundState(0);
			}
		}

		const unlisten = listenEvent("image_cropper_done", (e) => {
			setAvatarData(e.croppedImageData);
		});

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
		await navigate({ to: "/register" });
	}

	async function confirm() {
		await mutation.mutateAsync({
			avatar: avatarData,
			displayName: values.displayName.value,
			username: values.username.value,
		});
	}

	return (
		showInitial && (
			<AuthWrapper hidden={hidden}>
				{search.error && (
					<div className="flex w-full flex-col items-center justify-center">
						<IconMingcuteAlertLine className="size-20 text-error drop-shadow-[0px_0px_50px_rgb(var(--color-error))]" />
						<div className="mt-5 w-full text-center">
							<div className="font-bold text-2xl text-text">Error</div>
							<div className="mt-1 text-lg text-text/80">{errorText}</div>
							<div className="mt-5">
								<HuginnButton className="h-10 w-full bg-secondary" onClick={abort}>
									Back
								</HuginnButton>
							</div>
						</div>
					</div>
				)}
				{search.token && (
					<>
						<div className="flex w-full select-none flex-col items-center">
							<div className="mb-1 font-medium text-2xl text-text">Welcome {decodedToken?.fullName}!</div>
							<div className="text-center text-text opacity-70">Please confirm once everything looks good!</div>
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
