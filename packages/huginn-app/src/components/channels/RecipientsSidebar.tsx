import ChannelRecipient from "@components/ChannelRecipient";
import HuginnButton from "@components/button/HuginnButton";
import { useModalsDispatch } from "@contexts/modalContext";
import { useUser } from "@contexts/userContext";
import { Transition } from "@headlessui/react";
import type { PatchDMChannelMutationVars } from "@hooks/mutations/usePathDMChannel";
import { useLatestMutationState } from "@hooks/useLatestMutationStatus";
import type { APIChannelUser, Snowflake } from "@huginn/shared";
import { useMemo } from "react";

export default function RecipientsSidebar(props: { channelId: Snowflake; recipients: APIChannelUser[]; ownerId: Snowflake; visible: boolean }) {
	const { user } = useUser();
	const dispatch = useModalsDispatch();
	const state = useLatestMutationState<PatchDMChannelMutationVars>("patch-dm-channel");

	const recipients = useMemo<APIChannelUser[]>(
		() => [user as APIChannelUser, ...props.recipients].toSorted((a, b) => (a.username > b.username ? 1 : -1)),
		[user, props.recipients],
	);

	return (
		<Transition show={props.visible}>
			<div className="group relative my-2 w-56 flex-shrink-0 transition-all duration-200 data-[closed]:w-0 data-[closed]:scale-90 data-[closed]:opacity-0">
				<div className="absolute flex h-full w-[13.5rem] flex-col gap-y-2 overflow-hidden rounded-xl bg-secondary p-2 shadow-lg ring-2 ring-primary/70 transition-all duration-700 group-data-[closed]:ring-0">
					<div className="mt-1 ml-2 text-text/70 text-xs uppercase">Members - {recipients.length}</div>
					<div className="flex flex-col gap-y-0.5 ">
						{recipients.map((x) => (
							<ChannelRecipient isOwner={x.id === props.ownerId} key={x.id} recipient={x} channelId={props.channelId} />
						))}
					</div>
					<HuginnButton
						onClick={() => dispatch({ addRecipient: { isOpen: true, channelId: props.channelId } })}
						className="group/add flex h-12 w-full items-center justify-center border-2 border-success/50 border-dashed hover:border-success hover:bg-success/5"
					>
						<IconMdiPlus className="opacity-70 transition-opacity group-hover/add:opacity-100" />
					</HuginnButton>
					{state?.status === "pending" && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/40">
							<IconSvgSpinners3DotsFade className="size-10 text-text" />
						</div>
					)}
				</div>
			</div>
		</Transition>
	);
}
