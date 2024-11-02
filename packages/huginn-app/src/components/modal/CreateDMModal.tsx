import { Description, DialogPanel, DialogTitle } from "@headlessui/react";
import type { APIRelationUser } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";

export default function CreateDMModal() {
	const { createDM: modal } = useModals();
	const dispatch = useModalsDispatch();

	const client = useClient();
	const posthog = usePostHog();
	const { data } = useQuery(getRelationshipsOptions(client));

	const [selectedUsers, setSelectedUsers] = useState<APIRelationUser[]>([]);
	const { inputsProps, setInputValue, values, validateValues, handleErrors } = useInputs([{ name: "name", required: false }]);

	const mutation = useCreateDMChannel(handleErrors);

	const placeholderName = useChannelName(selectedUsers, null);

	useEffect(() => {
		if (modal.isOpen) {
			posthog.capture("create_group_modal_opened");
			setSelectedUsers([]);
		} else {
			posthog.capture("create_group_modal_closed");
		}
	}, [modal.isOpen]);

	useEffect(() => {
		if (selectedUsers.length < 2) {
			setInputValue("name", "");
		}
	}, [selectedUsers]);

	function onSelectionChanged(values: APIRelationUser[]) {
		setSelectedUsers(values);
	}

	function close() {
		dispatch({ createDM: { isOpen: false } });
	}

	async function findOrCreate() {
		if (!validateValues()) {
			return;
		}

		await mutation.mutateAsync({ recipients: selectedUsers?.map((x) => x.id), name: values.name.value });
		close();
	}
	return (
		<>
			<DialogPanel
				transition
				className="w-full max-w-md transform overflow-hidden rounded-xl border-2 border-primary bg-background transition-[opacity_transform] data-[closed]:scale-95"
			>
				<DialogTitle className="flex items-center justify-center gap-x-1.5">
					<div className="mt-5 font-medium text-2xl text-text">Create Direct Message</div>
				</DialogTitle>
				<Description className="mx-5 mt-1 text-center text-text/70">Select your fellow warrior(s) to share a tale with!</Description>
				<div className="flex flex-col gap-y-5 p-6">
					<HuginnInput
						{...inputsProps.name}
						placeholder={selectedUsers.length > 1 ? placeholderName : "Select 2 or more members"}
						disabled={selectedUsers.length < 2}
					>
						<HuginnInput.Label className="mb-2" text="Group Name" />
						<HuginnInput.Wrapper>
							<HuginnInput.Input />
						</HuginnInput.Wrapper>
					</HuginnInput>

					<AddRecipientInput relationships={data} onSelectionChanged={onSelectionChanged} />
				</div>
				<div className="bg-secondary p-5">
					<LoadingButton
						loading={mutation.isPending}
						className="h-10 w-full bg-primary"
						onClick={findOrCreate}
						disabled={selectedUsers.length === 0}
					>
						Find or Create
					</LoadingButton>
				</div>
				<ModalCloseButton onClick={close} />
			</DialogPanel>
		</>
	);
}
