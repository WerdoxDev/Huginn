import ChannelRecipient from "@components/ChannelRecipient";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import { HuginnButton, HuginnLoadingIcon } from "@huginn/frontend-shared";
import { ChannelType } from "@huginnjs/shared";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

import type { AppDirectChannel } from "@/types";

export default function ChannelMembersPanel(props: { channel: AppDirectChannel }) {
   const { user } = useThisUser();
   const addState = useMutationLatestState("add-channel-recipient");
   const removeState = useMutationLatestState("remove-channel-recipient");
   const { updateModals } = useModals();
   const { channel } = props;

   const loading = useMemo(
      () =>
         (addState?.variables?.channelId === props.channel.id && addState?.status === "pending") ||
         (removeState?.variables?.channelId === props.channel.id && removeState?.status === "pending"),
      [addState, removeState],
   );

   const recipients = useUsers(props.channel?.recipientIds);
   const sortedRecipients = useMemo(
      () =>
         [user, ...recipients].filter((x) => x !== undefined && x.username !== undefined).toSorted((a, b) => (a!.username! > b!.username! ? 1 : -1)),
      [user, props.channel.recipientIds, recipients],
   );

   function handleAddMember() {
      updateModals({ addRecipient: { isOpen: true, channelId: props.channel.id } });
   }

   if (channel.type !== ChannelType.GROUP_DM) return null;

   return (
      <div className="scroll-super-thin flex h-full flex-col overflow-y-auto pb-2">
         <div className="text-text/70 pt-4 pr-2 pb-2 pl-4 text-xs uppercase">Members - {sortedRecipients.length}</div>
         <div className="flex flex-col gap-y-0.5 rounded-lg p-0 pl-2">
            {sortedRecipients
               .filter((x) => x !== undefined)
               .map((x) => (
                  <ChannelRecipient isOwner={x.id === channel.ownerId} key={x.id} recipient={x} channelId={props.channel.id} />
               ))}
         </div>
         <HuginnButton
            onClick={handleAddMember}
            className="group/button border-primary-800 hover:bg-primary-800 active:bg-primary-800 mt-1 ml-2 flex items-center gap-x-2 border border-dashed p-1.5 text-left text-sm text-white/70 hover:text-white active:text-white"
         >
            <div className="bg-primary-800 group-hover/button:bg-primary-700 group-active/button:bg-primary-700 flex h-7 w-7 items-center justify-center rounded-full transition-colors">
               <IconMingcuteAddFill />
            </div>
            <div>Add Member</div>
         </HuginnButton>
         {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
               <HuginnLoadingIcon className="size-10" />
            </div>
         )}
      </div>
   );
}
