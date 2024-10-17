import LoadingButton from "@components/button/LoadingButton.tsx";
import ModalCloseButton from "@components/button/ModalCloseButton.tsx";
import AddRecipientInput from "@components/input/AddRecipientInput.tsx";
import BaseModal from "@components/modal/BaseModal.tsx";
import { useClient } from "@contexts/apiContext.tsx";
import { useModals, useModalsDispatch } from "@contexts/modalContext.tsx";
import { Description, DialogPanel, DialogTitle } from "@headlessui/react";
import { useAddChannelRecipient } from "@hooks/mutations/useAddChannelRecipient.ts";
import { useChannelRecipients } from "@hooks/useChannelRecipients.ts";
import type { APIRelationUser } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";

export function AddRecipientModal() {
	const { addRecipient: modal } = useModals();
	const dispatch = useModalsDispatch();
	const client = useClient();

	const posthog = usePostHog();
	const { data } = useQuery(getRelationshipsOptions(client));

	const { recipients } = useChannelRecipients(modal.channelId, "@me");
	const relationships = useMemo(() => data?.filter((x) => !recipients?.map((y) => y.id).includes(x.user.id)), [recipients, data]);

	const [selectedUsers, setSelectedUsers] = useState<APIRelationUser[]>([]);

	const mutation = useAddChannelRecipient();

	useEffect(() => {
		if (modal.isOpen) {
			posthog.capture("add_recipient_modal_opened");
			setSelectedUsers([]);
		} else {
			posthog.capture("add_recipient_modal_closed");
		}
	}, [modal.isOpen]);

	function close() {
		dispatch({ addRecipient: { isOpen: false } });
	}

	function onSelectionChanged(values: APIRelationUser[]) {
		setSelectedUsers(values);
	}

	function add() {
		for (const user of selectedUsers) {
			mutation.mutate({
				channelId: modal.channelId,
				recipientId: user.id,
			});
		}
		close();
	}

	return (
		<BaseModal modal={modal} onClose={close}>
			<DialogPanel className="w-full max-w-md transform overflow-hidden rounded-xl border-2 border-primary bg-background transition-[opacity_transform] data-[closed]:scale-95">
				<DialogTitle className="flex items-center justify-center gap-x-1.5">
					<div className="mt-5 font-medium text-2xl text-text">Add Member</div>
				</DialogTitle>
				<Description className="mx-5 mt-1 text-center text-text/70">Add your fellow warrior(s) to also share a tale with!</Description>
				<div className="flex flex-col gap-y-5 p-6">
					<AddRecipientInput label="New Members" relationships={relationships} onSelectionChanged={onSelectionChanged} />
				</div>
				<div className="bg-secondary p-5">
					<LoadingButton loading={mutation.isPending} className="h-10 w-full bg-primary" onClick={add} disabled={selectedUsers.length === 0}>
						Add
					</LoadingButton>
				</div>
				<ModalCloseButton onClick={close} />
			</DialogPanel>
		</BaseModal>
	);
}
