import type { SettingsTabProps } from "@/types";
import AnimatedMessage from "@components/AnimatedMessage";
import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import HuginnInput from "@components/input/HuginnInput";
import PasswordInput from "@components/input/PasswordInput";
import { Tooltip } from "@components/tooltip/Tooltip";
import { useClient } from "@contexts/apiContext";
import { useEvent } from "@contexts/eventContext";
import { useModalsDispatch } from "@contexts/modalContext";
import { useUser } from "@contexts/userContext";
import { Transition } from "@headlessui/react";
import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { useInputs } from "@hooks/useInputs";
import useUniqueUsernameMessage from "@hooks/useUniqueUsernameMessage";
import { omit } from "@huginn/shared";
import { getUserAvatar } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export default function SettingsProfileTab(_props: SettingsTabProps) {
	const client = useClient();
	const { user, setUser } = useUser();
	const { listenEvent } = useEvent();
	const modalsDispatch = useModalsDispatch();

	const { data: originalAvatar } = useQuery(getUserAvatar(user?.id, user?.avatar, client));

	const {
		inputsProps,
		values,
		handleErrors,
		resetStatuses,
		setInputValue: onValueChanged,
	} = useInputs([
		{ name: "username", required: true, default: user?.username },
		{ name: "displayName", required: false, default: user?.displayName },
		{ name: "password", required: false },
	]);

	const [avatarData, setAvatarData] = useState<string | null | undefined>(() => originalAvatar);

	const { message: usernameMessageDetail, onFocusChanged, onChanged } = useUniqueUsernameMessage(values, "username");

	const mutation = usePatchUser((result) => {
		client.tokenHandler.token = result.token;
		client.tokenHandler.refreshToken = result.refreshToken;
		setUser(omit(result, ["refreshToken", "token"]));

		onValueChanged("password", "");
		resetStatuses();

		onChanged(values.username.value, result.username);
		onFocusChanged(false);
	}, handleErrors);

	const [avatarModified, setAvatarModified] = useState(false);
	const [modified, setModified] = useState(false);

	useMemo(() => {
		const displayName = !user?.displayName ? "" : user.displayName;
		setModified(values.username.value !== user?.username || values.displayName.value !== displayName);
	}, [values, user]);

	useEffect(() => {
		if (originalAvatar) {
			setAvatarData(originalAvatar);
		}
	}, [originalAvatar]);

	useEffect(() => {
		const unlisten = listenEvent("user_updated", (e) => {
			if (e.self) {
				setModified(false);
				setAvatarModified(false);
			}
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

	function openFileDialog() {
		const input = document.createElement("input");
		input.type = "file";
		input.multiple = false;
		input.accept = "image/png,image/jpeg,image/webp,image/gif";

		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];

			if (!file) {
				return;
			}

			const reader = new FileReader();
			reader.readAsDataURL(file);

			reader.onload = (readerEvent) => {
				const content = readerEvent.target?.result;
				if (typeof content === "string") {
					modalsDispatch({ imageCrop: { isOpen: true, originalImageData: content } });
				}
			};
		};

		input.click();
	}

	async function edit() {
		await mutation.mutateAsync({
			displayName: values.displayName.value,
			username: values.username.value === user?.username ? undefined : values.username.value,
			password: values.password.value,
			avatar: originalAvatar && !avatarData ? null : originalAvatar === avatarData ? undefined : avatarData,
		});
	}

	function revert() {
		if (!user) {
			return;
		}

		setAvatarData(originalAvatar);
		onValueChanged("username", user.username);
		onValueChanged("displayName", user.displayName);
		onValueChanged("password", "");

		onFocusChanged(false);

		setAvatarModified(false);
		setModified(false);
	}

	return (
		<>
			<div className="flex h-full items-start gap-x-5">
				<div className="bg-secondary flex rounded-lg p-4">
					<div onClick={openFileDialog} className="group relative h-24 w-24 cursor-pointer overflow-hidden rounded-full bg-black">
						{avatarData ? (
							<img alt="editing-user-avatar" className="h-full w-full object-cover" src={avatarData} />
						) : (
							<div className="bg-primary h-full w-full" />
						)}

						<div className="absolute inset-0 flex h-full w-full items-center justify-center gap-x-1 rounded-full group-hover:bg-black/30">
							<Tooltip>
								<Tooltip.Trigger>
									<IconMdiEdit className="invisible size-7 text-white group-hover:visible" />
								</Tooltip.Trigger>
								<Tooltip.Content>Edit</Tooltip.Content>
							</Tooltip>
							<Tooltip>
								<Tooltip.Trigger>
									<IconMdiDelete
										onClick={(e) => {
											e.stopPropagation();
											if (avatarData) {
												setAvatarData(null);
												setAvatarModified(true);
											}
										}}
										className="text-error invisible size-7 group-hover:visible"
									/>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<div className="text-error">Delete</div>
								</Tooltip.Content>
							</Tooltip>
						</div>
					</div>
				</div>
				<div className="bg-secondary mb-20 flex w-full flex-col gap-y-5 rounded-lg p-4">
					<HuginnInput {...inputsProps.username} onFocusChanged={onFocusChanged}>
						<HuginnInput.Label text="Username" className="mb-2" />
						<HuginnInput.Wrapper className="!bg-background" border="left">
							<HuginnInput.Input className="lowercase" />
						</HuginnInput.Wrapper>
						<AnimatedMessage className="mt-1" {...usernameMessageDetail} />
					</HuginnInput>

					<HuginnInput placeholder={user?.username} {...inputsProps.displayName}>
						<HuginnInput.Label text="Display Name" className="mb-2" />
						<HuginnInput.Wrapper className="!bg-background" border="left">
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>

					<HuginnInput {...inputsProps.password} type="password">
						<HuginnInput.Label text="Current Password" className="mb-2" />
						<HuginnInput.Wrapper className="!bg-background" border="left">
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
				</div>
			</div>
			<Transition show={modified || avatarModified}>
				<div className="border-primary/50 bg-secondary absolute bottom-5 left-[13.25rem] right-9 flex transform justify-end gap-x-2 rounded-xl border-2 p-2 shadow-sm transition data-[closed]:translate-y-10 data-[closed]:opacity-0">
					<div className="text-text ml-2 w-full self-center ">You have unsaved changes!</div>
					<HuginnButton onClick={revert} className="w-20 shrink-0 py-2 decoration-white hover:underline">
						Revert
					</HuginnButton>
					<LoadingButton
						loading={mutation.isPending}
						disabled={!modified && !avatarModified}
						onClick={edit}
						className="bg-primary disabled:bg-primary/50 w-36 shrink-0 !rounded-lg py-2"
					>
						Save changes
					</LoadingButton>
				</div>
			</Transition>
		</>
	);
}
