import HuginnButton from "@components/button/HuginnButton";
import ChannelRecipient from "@components/ChannelRecipient";
import LoadingIcon from "@components/LoadingIcon";
import TopBar from "@components/TopBar";
import { Transition } from "@headlessui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import type { Snowflake } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

export default function RecipientsSidebar(props: { channelId: Snowflake; recipientIds: Snowflake[]; ownerId: Snowflake }) {
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
      <div className="bg-surface-alt group relative flex h-full w-full shrink-0 flex-col overflow-hidden">
         {/* <div className="flex h-16 items-center justify-center gap-x-2">
            <div className="bg-primary-700 h-8 rounded-md px-2 py-1 text-center text-white">Info</div>
            <div className="bg-surface text-text/50 h-8 rounded-md px-2 py-1 text-center">Search</div>
         </div>
         <div className="h-0.5 shrink-0 bg-white/10" /> */}
         <div className="mt-2 flex flex-col gap-y-2 p-2">
            <div className="text-text/70 ml-2 text-xs uppercase">Members - {sortedRecipients.length}</div>
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
         <div className="bg-surface mt-auto h-16 shrink-0"></div>
      </div>
   );
}
