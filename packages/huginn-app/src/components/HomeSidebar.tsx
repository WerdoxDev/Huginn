import { useModals } from "@stores/modalsStore";
import { useReadStates } from "@stores/readStatesStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useMemo } from "react";
import type { AppDirectChannel } from "@/types";
import AttentionIndicator from "./AttentionIndicator";
import RingLinkButton from "./button/RingLinkButton";
import DirectMessageChannel from "./DirectMessageChannel";
import Tooltip from "./tooltip/Tooltip";
import VoiceStatus from "./voice/VoiceStatus";

export default function HomeSidebar(props: { channels?: AppDirectChannel[] }) {
   const huginnWindow = useHuginnWindow();
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

   return (
      <nav
         className={clsx(
            "bg-surface-alt flex h-full flex-col overflow-hidden rounded-l-xl",
            huginnWindow.environment === "browser" && "rounded-tl-none",
         )}
      >
         <div className="h-19 flex shrink-0 items-center px-6">
            <div className="text-text text-xl font-bold">Home</div>
            <div className="relative ml-6">
               <RingLinkButton prefetch="intent" to="/friends" className="px-2.5 py-1 text-xs font-medium">
                  Friends
               </RingLinkButton>
               {friendsNotificationsCount !== 0 && (
                  <AttentionIndicator className="-bottom-3 -right-2.5">{friendsNotificationsCount}</AttentionIndicator>
               )}
            </div>
         </div>
         <div className="h-0.5 shrink-0 bg-white/10" />
         <div className="mx-3.5 mb-3 mt-6 flex shrink-0 items-center justify-between text-xs">
            <div className="text-text/70 hover:text-text font-medium uppercase">Direct Messages</div>
            <Tooltip>
               <Tooltip.Trigger onClick={() => updateModals({ createDM: { isOpen: true } })}>
                  <IconMingcuteAddFill className="text-text/80 hover:text-text size-4" />
               </Tooltip.Trigger>
               <Tooltip.Content>Create DM</Tooltip.Content>
            </Tooltip>
         </div>
         <ul className="scroll-alternative2 scroll-super-thin flex h-full flex-col gap-y-0.5 overflow-x-hidden overflow-y-scroll pb-2 pl-2 pr-1 pt-0.5">
            {sortedChannels?.map((channel) => (
               <DirectMessageChannel key={channel.id} channel={channel} />
            ))}
         </ul>
         <VoiceStatus />
      </nav>
   );
}
