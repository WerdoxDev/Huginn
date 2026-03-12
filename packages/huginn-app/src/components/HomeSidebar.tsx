import { useModals } from "@stores/modalsStore";
import { useReadStates } from "@stores/readStatesStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useMemo } from "react";

import type { AppDirectChannel } from "@/types";

import AttentionIndicator from "./AttentionIndicator";
import HuginnButton from "./button/HuginnButton";
import RingLinkButton from "./button/RingLinkButton";
import DirectMessageChannel from "./DirectMessageChannel";
import Tooltip from "./tooltip/Tooltip";
import VoiceStatus from "./voice/VoiceStatus";

export default function HomeSidebar(props: { channels?: AppDirectChannel[] }) {
   const { updateModals } = useModals();
   const { friendsNotificationsCount } = useReadStates();

   const sortedChannels = useMemo(
      () =>
         props.channels?.toSorted((a, b) => {
            const aId = BigInt(a.lastMessageId || a.id);
            const bId = BigInt(b.lastMessageId || b.id);

            // Sort in descending order (newest first)
            // For ascending order (oldest first), swap the comparison
            return aId > bId ? -1 : aId < bId ? 1 : 0;
         }),
      [props.channels],
   );

   function handleCreateChannel() {
      updateModals({ createDM: { isOpen: true } });
   }

   return (
      <nav className={clsx("bg-surface-alt flex h-full flex-col overflow-hidden rounded-l-xl")}>
         <div className="h-topbar flex shrink-0 items-center px-6">
            <div className="text-text text-xl font-bold">Home</div>
            <div className="relative ml-6">
               <RingLinkButton preload="intent" to="/friends" className="px-2.5 py-1 text-xs font-medium">
                  Friends
               </RingLinkButton>
               {friendsNotificationsCount !== 0 && (
                  <AttentionIndicator className="-right-2.5 -bottom-3">{friendsNotificationsCount}</AttentionIndicator>
               )}
            </div>
         </div>
         <div className="h-0.5 shrink-0 bg-white/10" />
         <ul className="scroll-super-thin flex h-full flex-col overflow-x-hidden overflow-y-scroll">
            <div className="text-text/70 pt-4 pr-2 pb-2 pl-4 text-xs uppercase">Direct Messages</div>
            <HuginnButton
               onClick={handleCreateChannel}
               className="group/button border-primary-800 hover:bg-primary-800 active:bg-primary-800 mb-1 ml-2 flex items-center gap-x-2 border border-dashed p-1.5 text-left text-sm text-white/70 hover:text-white active:text-white"
            >
               <div className="bg-primary-800 group-hover/button:bg-primary-700 group-active/button:bg-primary-700 flex h-7 w-7 items-center justify-center rounded-full transition-colors">
                  <IconMingcuteAddFill />
               </div>
               <div>Create Channel</div>
            </HuginnButton>
            <div className="flex flex-col gap-y-0.5 rounded-lg pb-2 pl-2">
               {sortedChannels?.map((channel) => (
                  <DirectMessageChannel key={channel.id} channel={channel} />
               ))}
            </div>
         </ul>
         <VoiceStatus />
      </nav>
   );
}
