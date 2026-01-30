import { useIsMobile } from "@hooks/useIsMobile";
import clsx from "clsx";
import type { AppDirectChannel } from "@/types";
import { useMobileMenuStore } from "@stores/mobileMenuStore";
import { ChannelType } from "@huginn/shared";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import { useThisUser } from "@stores/userStore";
import { useEffect, useMemo } from "react";
import ChannelRecipient from "@components/ChannelRecipient";
import LoadingIcon from "@components/LoadingIcon";
import HuginnButton from "@components/button/HuginnButton";
import { useModals } from "@stores/modalsStore";

export default function ChannelSidebar(props: { channel: AppDirectChannel }) {
   const { user } = useThisUser();
   const patchState = useMutationLatestState("patch-dm-channel");
   const addState = useMutationLatestState("add-channel-recipient");
   const removeState = useMutationLatestState("remove-channel-recipient");
   const { updateModals } = useModals();

   const { isRightOpen, isDragging, rightMenuWidth } = useMobileMenuStore();
   const isMobile = useIsMobile();

   useEffect(() => {
      console.log(isRightOpen);
   }, [isRightOpen]);

   const loading = useMemo(
      () =>
         (patchState?.variables?.channelId === props.channel.id && patchState?.status === "pending") ||
         (addState?.variables?.channelId === props.channel.id && addState?.status === "pending") ||
         (removeState?.variables?.channelId === props.channel.id && removeState?.status === "pending"),
      [patchState, addState, removeState],
   );

   const recipients = useUsers(props.channel?.recipientIds);
   const sortedRecipients = useMemo(
      () =>
         [user, ...recipients].filter((x) => x !== undefined && x.username !== undefined).toSorted((a, b) => (a!.username! > b!.username! ? 1 : -1)),
      [user, props.channel.recipientIds],
   );

   function handleAddMember() {
      updateModals({ addRecipient: { isOpen: true, channelId: props.channel.id } });
   }

   if (props.channel.type !== ChannelType.GROUP_DM) return;

   return (
      <div
         className={clsx(
            "top-topbar-separator fixed inset-y-0 right-0 bottom-0 z-20 shrink-0 lg:relative lg:top-0 lg:bottom-0 lg:h-full",
            isMobile && !isDragging && "transition-transform",
            !isMobile && "transition-[width]",
         )}
         style={{
            width: isMobile ? rightMenuWidth : isRightOpen ? rightMenuWidth : "0",
            transform: isMobile ? `translateX(${rightMenuWidth - (isRightOpen ? rightMenuWidth : 0)}px)` : "none",
         }}
      >
         <div className="absolute inset-0 flex" style={{ width: rightMenuWidth }}>
            <div className="bg-surface h-full w-0 shrink-0 overflow-hidden lg:w-0.5" />
            <div className="bg-surface-alt group relative flex h-full w-full flex-col overflow-hidden">
               <div className="scroll-super-thin flex flex-col overflow-y-scroll">
                  <div className="text-text/70 pt-4 pr-2 pb-2 pl-4 text-xs uppercase">Members - {sortedRecipients.length}</div>
                  <div className="flex flex-col gap-y-0.5 rounded-lg p-0 pl-2">
                     {sortedRecipients
                        .filter((x) => x !== undefined)
                        .map((x) => (
                           <ChannelRecipient isOwner={x.id === props.channel.ownerId} key={x.id} recipient={x} channelId={props.channel.id} />
                        ))}
                  </div>
                  <HuginnButton
                     onClick={handleAddMember}
                     className="border-primary-800 group/button hover:bg-primary-800 active:bg-primary-800 mt-1 ml-2 flex items-center gap-x-2 border border-dashed p-1.5 text-left text-sm text-white/70 hover:text-white active:text-white"
                  >
                     <div className="bg-primary-800 group-hover/button:bg-primary-700 group-active/button:bg-primary-700 flex h-7 w-7 items-center justify-center rounded-full transition-colors">
                        <IconMingcuteAddFill />
                     </div>
                     <div>Add Member</div>
                  </HuginnButton>
                  {loading && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <LoadingIcon className="size-10" />
                     </div>
                  )}
               </div>
               <div className="bg-surface mt-auto h-16 shrink-0"></div>
            </div>
         </div>
      </div>
   );
}
