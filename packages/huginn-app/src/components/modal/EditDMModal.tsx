import ImageSelector from "@components/ImageSelector.tsx";
import HuginnButton from "@components/button/HuginnButton.tsx";
import LoadingButton from "@components/button/LoadingButton.tsx";
import ModalCloseButton from "@components/button/ModalCloseButton.tsx";
import HuginnInput from "@components/input/HuginnInput.tsx";
import BaseModal from "@components/modal/BaseModal.tsx";
import { useClient } from "@contexts/apiContext.tsx";
import { useEvent } from "@contexts/eventContext.tsx";
import { useModals, useModalsDispatch } from "@contexts/modalContext.tsx";
import { Description, DialogPanel, DialogTitle } from "@headlessui/react";
import { usePatchDMChannel } from "@hooks/mutations/usePathDMChannel.ts";
import { useChannelName } from "@hooks/useChannelName.ts";
import { useInputs } from "@hooks/useInputs.ts";
import { getChannelIcon } from "@lib/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function EditGroupModal() {
	const client = useClient();
	const { editGroup: modal } = useModals();
	const modalsDispatch = useModalsDispatch();
	const { listenEvent } = useEvent();
	const { inputsProps, setInputValue, handleErrors, values, validateValues, resetStatuses } = useInputs([{ name: "name", required: false }]);

	const { data: originalIcon } = useQuery(getChannelIcon(modal.channel?.id, modal.channel?.icon, client));
	const mutation = usePatchDMChannel(handleErrors);

	const placeholderName = useChannelName(modal.channel?.recipients, null);
	const [iconData, setIconData] = useState<string | null | undefined>();

	useEffect(() => {
		if (!modal.channel) {
			return;
		}

		setInputValue("name", modal.channel.name ?? placeholderName);
		setIconData(originalIcon);
		resetStatuses();
	}, [modal]);

	useEffect(() => {
		const unlisten = listenEvent("image_cropper_done", (e) => {
			setIconData(e.croppedImageData);
		});

		return () => {
			unlisten();
		};
	}, []);

	function onSelected(data: string, mimeType: string) {
		modalsDispatch({ imageCrop: { isOpen: true, originalImageData: data, mimeType: mimeType } });
	}

	function onDelete() {
		if (iconData) {
			setIconData(null);
		}
	}

	async function edit() {
		if (!modal.channel || !validateValues()) {
			return;
		}

		await mutation.mutateAsync({
			channelId: modal.channel?.id,
			name: placeholderName === values.name.value ? null : values.name.value,
			icon: originalIcon && !iconData ? null : originalIcon === iconData ? undefined : iconData,
		});
		modalsDispatch({ editGroup: { isOpen: false, channel: undefined } });
	}

	function close() {
		modalsDispatch({ editGroup: { channel: undefined, isOpen: false } });
	}

	return (
		<BaseModal modal={modal} onClose={close}>
			<DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-xl border-2 border-primary bg-background transition-[opacity_transform] data-[closed]:scale-95">
				<DialogTitle className="mt-5 flex items-center justify-center gap-x-1.5">
					<div className="font-medium text-2xl text-text">Edit Group</div>
				</DialogTitle>
				<Description className="mx-5 mt-1 text-center text-text/70">Modify this group to exactly fit your needs!</Description>
				<div className="flex gap-x-5 p-5">
					<ImageSelector data={iconData} onSelected={onSelected} onDelete={onDelete} />
					<HuginnInput {...inputsProps.name} className="mt-2 w-full" placeholder={placeholderName}>
						<HuginnInput.Label className="mb-2" text="Group Name" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>
				</div>
				<div className="flex w-full items-center justify-end gap-x-2 bg-secondary p-5">
					<HuginnButton className="h-10 w-20 decoration-white hover:underline" onClick={close}>
						Cancel
					</HuginnButton>
					<LoadingButton loading={mutation.isPending} className="h-10 w-36 bg-primary" onClick={edit}>
						Save
					</LoadingButton>
				</div>
				<ModalCloseButton onClick={close} />
			</DialogPanel>
		</BaseModal>
	);
}
