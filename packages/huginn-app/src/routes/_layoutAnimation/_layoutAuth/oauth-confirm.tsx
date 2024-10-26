import type { APIPostOAuthConfirmJSONBody, IdentityTokenPayload, TokenPayload } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as jose from "jose";

type Search = {
	token: string;
};

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/oauth-confirm")({
	validateSearch: (search: Record<string, string>): Search => {
		return { token: search.token };
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

	const decodedToken = useMemo(() => {
		return jose.decodeJwt(search.token) as IdentityTokenPayload;
	}, [search]);

	const {
		inputsProps,
		values,
		statuses,
		handleErrors,
		resetStatuses,
		resetInput,
		setInputValue: onValueChanged,
	} = useInputs([
		{ name: "username", required: true, default: decodedToken.username },
		{ name: "displayName", required: false, default: decodedToken.fullName },
	]);

	const { data: originalAvatar } = useQuery(getUserAvatar(decodedToken.providerUserId, decodedToken.avatarHash, client));
	const [avatarData, setAvatarData] = useState<string | null>(null);

	const { message: usernameMessageDetail, onFocusChanged, onChanged } = useUniqueUsernameMessage(values, resetInput, "username");

	const mutation = useHuginnMutation(
		{
			async mutationFn(body: APIPostOAuthConfirmJSONBody) {
				await client.auth.confirmOAuth(body, search.token);
			},
		},
		handleErrors,
	);

	useEffect(() => {
		setAuthBackgroundState(0);

		const unlisten = listenEvent("image_cropper_done", (e) => {
			setAvatarData(e.croppedImageData);
		});

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
		modalsDispatch({ imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType } });
	}

	async function abort() {
		await navigate({ to: "/register" });
	}

	async function confirm() {
		await mutation.mutateAsync({ avatar: avatarData, displayName: values.displayName.value, username: values.username.value });
	}

	return (
		<AuthWrapper hidden={false} className="!w-auto max-w-[30rem]">
			<div className="flex w-full select-none flex-col items-center">
				<div className="mb-2 font-medium text-2xl text-text">Welcome {decodedToken.fullName}!</div>
				<div className="text-center text-text opacity-70">We are very happy to have you here! Please confirm once everything looks good</div>
			</div>
			<div className="mt-5 flex w-full items-end gap-x-5">
				<ImageSelector data={avatarData} onDelete={onDelete} onSelected={onSelected} size="7.5rem" className="p-4" />
				<div className="flex w-full flex-col">
					<HuginnInput {...inputsProps.username} onFocusChanged={onFocusChanged} className="mb-5">
						<HuginnInput.Label text="Username" className="mb-2" />
						<HuginnInput.Wrapper border="left">
							<HuginnInput.Input className="lowercase" />
						</HuginnInput.Wrapper>
						<AnimatedMessage className="mt-1" {...usernameMessageDetail} />
					</HuginnInput>

					<HuginnInput placeholder={decodedToken.username} {...inputsProps.displayName}>
						<HuginnInput.Label text="Display Name" className="mb-2" />
						<HuginnInput.Wrapper border="left">
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
				</div>
			</div>
			<div className="mt-5 flex w-full gap-x-2">
				<HuginnButton className="w-full bg-secondary" onClick={abort}>
					Abort
				</HuginnButton>
				<LoadingButton onClick={confirm} loading={!mutation.isIdle && mutation.isPending} className="h-10 w-full bg-primary" type="submit">
					Confirm
				</LoadingButton>
			</div>
		</AuthWrapper>
	);
}
