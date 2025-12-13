import HuginnButton from "@components/button/HuginnButton";
import ChannelRecipient from "@components/ChannelRecipient";
import LoadingIcon from "@components/LoadingIcon";
import { Transition } from "@headlessui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import type { Snowflake } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

export default function RecipientsSidebar(props: { channelId: Snowflake; recipientIds: Snowflake[]; ownerId: Snowflake; show: boolean }) {
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

   const recipients = useUsers(props.recipientIds);
   const sortedRecipients = useMemo(
      () =>
         [user, ...recipients].filter((x) => x !== undefined && x.username !== undefined).toSorted((a, b) => (a!.username! > b!.username! ? 1 : -1)),
      [user, props.recipientIds],
   );

   return (
      <Transition show={props.show}>
         <div className="w-58 data-closed:w-0 data-closed:scale-0 data-closed:opacity-0 group relative mb-16 shrink-0 transition-all duration-200">
            <div className="bg-surface-alt ring-primary-800 group-data-closed:ring-0 absolute inset-0 m-2 ml-0.5 flex flex-col gap-y-2 overflow-hidden rounded-xl p-2 shadow-lg ring-2 transition-all duration-700">
               <div className="text-text/70 ml-2 mt-1 text-xs uppercase">Members - {sortedRecipients.length}</div>
               <div className="flex flex-col gap-y-0.5">
                  {sortedRecipients
                     .filter((x) => x !== undefined)
                     .map((x) => (
                        <ChannelRecipient isOwner={x.id === props.ownerId} key={x.id} recipient={x} channelId={props.channelId} />
                     ))}
               </div>
               <HuginnButton
                  onClick={() => updateModals({ addRecipient: { isOpen: true, channelId: props.channelId } })}
                  className="group/add border-positive-600 hover:border-positive-100 hover:bg-positive-800 flex h-12 w-full items-center justify-center border-2 border-dashed"
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
