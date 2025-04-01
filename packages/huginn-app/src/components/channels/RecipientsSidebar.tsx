import ChannelRecipient from "@components/ChannelRecipient";
import LoadingIcon from "@components/LoadingIcon";
import HuginnButton from "@components/button/HuginnButton";
import { Transition } from "@headlessui/react";
import { useUser, useUsers } from "@hooks/api-hooks/userHooks";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import type { Snowflake } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

export default function RecipientsSidebar(props: { channelId: Snowflake; recipientIds: Snowflake[]; ownerId: Snowflake; visible: boolean }) {
	const { user } = useThisUser();
	const { updateModals } = useModals();
	const patchState = useMutationLatestState("patch-dm-channel");
	const addState = useMutationLatestState("add-channel-recipient");
	const removeState = useMutationLatestState("remove-channel-recipient");

	const loading = useMemo(
		() =>
			(patchState?.variables?.channelId === props.channelId && patchState.status === "pending") ||
			(addState?.variables?.channelId === props.channelId && addState.status === "pending") ||
			(removeState?.variables?.channelId === props.channelId && removeState.status === "pending"),
		[patchState, addState, removeState],
	);

	// const recipients = useMemo<APIChannelUser[]>(
	// 	() => [user as APIChannelUser, ...props.recipients].toSorted((a, b) => (a.username > b.username ? 1 : -1)),
	// 	[user, props.recipients],
	// );
	const recipients = useUsers(props.recipientIds);
	const sortedRecipients = useMemo(
		() => [user, ...recipients].filter((x) => x !== undefined).toSorted((a, b) => (a.username > b.username ? 1 : -1)),
		[user, props.recipientIds],
	);

	return (
		<Transition show={props.visible}>
			<div className="group relative my-2 mb-16 w-56 flex-shrink-0 transition-all duration-200 data-[closed]:w-0 data-[closed]:scale-90 data-[closed]:opacity-0">
				<div className="absolute top-0 bottom-2 flex w-[13.5rem] flex-col gap-y-2 overflow-hidden rounded-xl bg-secondary p-2 shadow-lg ring-2 ring-primary/70 transition-all duration-700 group-data-[closed]:ring-0">
					<div className="mt-1 ml-2 text-text/70 text-xs uppercase">Members - {recipients.length}</div>
					<div className="flex flex-col gap-y-0.5 ">
						{sortedRecipients
							.filter((x) => x !== undefined)
							.map((x) => (
								<ChannelRecipient isOwner={x.id === props.ownerId} key={x.id} recipient={x} channelId={props.channelId} />
							))}
					</div>
					<HuginnButton
						onClick={() => updateModals({ addRecipient: { isOpen: true, channelId: props.channelId } })}
						className="group/add flex h-12 w-full items-center justify-center border-2 border-success/50 border-dashed hover:border-success hover:bg-success/5"
					>
						<IconMingcuteAddFill className="opacity-70 transition-opacity group-hover/add:opacity-100" />
					</HuginnButton>
					{loading && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/40">
							<LoadingIcon className="size-10" />
						</div>
					)}
				</div>
			</div>
		</Transition>
	);
}
