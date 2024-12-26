import type { SettingsTabProps } from "@/types";
import { Transition } from "@headlessui/react";
import { omit } from "@huginn/shared";
import { getUserAvatar } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";

export default function SettingsProfileTab(_props: SettingsTabProps) {
	const client = useClient();
	const { user, setUser, tokenPayload } = useUser();
	const { listenEvent } = useEvent();
	const modalsDispatch = useModalsDispatch();

	const { inputsProps, values, handleErrors, resetStatuses, resetInput, setValue } = useInputs([
		{ name: "username", required: true, default: user?.username, lowercase: true },
		{ name: "displayName", required: false, default: user?.displayName },
		{ name: "password", required: false },
		{ name: "newPassword", required: false },
	]);

	const { data: originalAvatar } = useQuery(getUserAvatar(user?.id, user?.avatar, client));
	const [avatarData, setAvatarData] = useState<string | null | undefined>(() => originalAvatar);

	const { message: usernameMessageDetail, onFocusChanged, onChanged } = useUniqueUsernameMessage(values, resetInput, "username");

	const mutation = usePatchUser((result) => {
		client.tokenHandler.token = result.token;
		client.tokenHandler.refreshToken = result.refreshToken;
		setUser(omit(result, ["refreshToken", "token"]));

		setValue("password", "");
		setValue("newPassword", "");
		resetStatuses();

		onChanged(values.username.value, result.username);
		onFocusChanged(false);
	}, handleErrors);

	const [avatarModified, setAvatarModified] = useState(false);
	const [modified, setModified] = useState(false);

	useMemo(() => {
		const displayName = !user?.displayName ? "" : user.displayName;
		setModified(values.username.value !== user?.username || values.displayName.value !== displayName || values.newPassword.value !== "");
	}, [values, user]);

	useEffect(() => {
		if (originalAvatar) {
			setAvatarData(originalAvatar);
		}
	}, [originalAvatar]);

	useEffect(() => {
		const unlisten = listenEvent("user_updated", (e) => {
			setModified(false);
			setAvatarModified(false);
		});

		const unlisten2 = listenEvent("image_cropper_done", (e) => {
			setAvatarData(e.croppedImageData);
			setAvatarModified(true);
		});

		return () => {
			unlisten();
			unlisten2();
		};
	}, []);

	function onDelete() {
		if (avatarData) {
			setAvatarData(null);
			setAvatarModified(true);
		}
	}

	function onSelected(data: string, mimeType: string) {
		modalsDispatch({ imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType } });
	}

	function edit() {
		mutation.mutate({
			displayName: values.displayName.value,
			username: values.username.value === user?.username ? undefined : values.username.value,
			password: values.password.value,
			newPassword: values.newPassword.value,
			avatar: originalAvatar && !avatarData ? null : originalAvatar === avatarData ? undefined : avatarData,
		});
	}

	function revert() {
		if (!user) {
			return;
		}

		setAvatarData(originalAvatar);
		setValue("username", user.username);
		setValue("displayName", user.displayName);
		setValue("password", "");
		setValue("newPassword", "");
		resetStatuses();

		onFocusChanged(false);

		setAvatarModified(false);
		setModified(false);
	}

	return (
		<>
			<div className="flex items-start gap-x-5">
				<ImageSelector data={avatarData} onDelete={onDelete} onSelected={onSelected} className="p-4" buttonsClassName="mt-4">
					<div className="mb-4 font-semibold text-text">Profile Picture</div>
				</ImageSelector>
				<div className="flex w-full max-w-xs flex-col gap-y-2">
					<div className="rounded-lg bg-secondary p-4">
						<div className="mb-4 font-semibold text-text">Personal Information</div>
						<div className="flex flex-col gap-y-5">
							<HuginnInput {...inputsProps.username} onFocusChanged={onFocusChanged}>
								<HuginnInput.Label text="Username" className="mb-2" />
								<HuginnInput.Wrapper className="!bg-background" border="left">
									<HuginnInput.Input />
								</HuginnInput.Wrapper>
								<AnimatedMessage className="mt-1" {...usernameMessageDetail} />
							</HuginnInput>

							<HuginnInput placeholder={user?.username} {...inputsProps.displayName}>
								<HuginnInput.Label text="Display Name" className="mb-2" />
								<HuginnInput.Wrapper className="!bg-background" border="left">
									<HuginnInput.Input />
								</HuginnInput.Wrapper>
							</HuginnInput>
						</div>
					</div>
				</div>
				{!tokenPayload?.isOAuth && (
					<div className="flex w-full max-w-xs flex-col gap-y-2">
						<div className="rounded-lg bg-secondary p-4">
							<div className="mb-4 font-semibold text-text">Security</div>
							<div className="flex flex-col gap-y-5 ">
								<PasswordInput {...inputsProps.password} type="password">
									<HuginnInput.Label text="Current Password" className="mb-2" />
									<HuginnInput.Wrapper className="!bg-background" border="left">
										<HuginnInput.Input />
										<PasswordInput.ToggleButton className="border-l-secondary" />
									</HuginnInput.Wrapper>
								</PasswordInput>
								<PasswordInput {...inputsProps.newPassword} type="password">
									<HuginnInput.Label text="New Password" className="mb-2" />
									<HuginnInput.Wrapper className="!bg-background" border="left">
										<HuginnInput.Input />
										<PasswordInput.ToggleButton className="border-l-secondary" />
									</HuginnInput.Wrapper>
								</PasswordInput>
							</div>
						</div>
					</div>
				)}
			</div>
			<Transition show={modified || avatarModified}>
				<div className="absolute right-9 bottom-5 left-[13.25rem] flex transform justify-end gap-x-2 rounded-xl border-2 border-primary/50 bg-secondary p-2 shadow-sm transition data-[closed]:translate-y-10 data-[closed]:opacity-0">
					<div className="ml-2 w-full self-center text-text ">You have unsaved changes!</div>
					<HuginnButton onClick={revert} className="w-20 shrink-0 py-2 decoration-white hover:underline">
						Revert
					</HuginnButton>
					<LoadingButton
						loading={mutation.isPending}
						disabled={!modified && !avatarModified}
						onClick={edit}
						className="!rounded-lg w-36 shrink-0 bg-primary disabled:bg-primary/50"
					>
						Save changes
					</LoadingButton>
				</div>
			</Transition>
		</>
	);
}
