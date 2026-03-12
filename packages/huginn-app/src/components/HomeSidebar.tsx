import type { Snowflake } from "@huginn/shared";

import { useModals } from "@stores/modalsStore";
import { useReadStates } from "@stores/readStatesStore";
import { useParams } from "@tanstack/react-router";
import { animate, createAnimatable, createScope, Scope, type AnimatableObject } from "animejs";
import clsx from "clsx";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import type { AppDirectChannel } from "@/types";

import AttentionIndicator from "./AttentionIndicator";
import HuginnButton from "./button/HuginnButton";
import RingLinkButton from "./button/RingLinkButton";
import DirectMessageChannel from "./DirectMessageChannel";
import VoiceStatus from "./voice/VoiceStatus";

export default function HomeSidebar(props: { channels?: AppDirectChannel[] }) {
   const { updateModals } = useModals();
   const { friendsNotificationsCount } = useReadStates();
   const { channelId } = useParams({ strict: false }) as { channelId?: string };
   const indicator = useRef<HTMLDivElement>(null);
   const [showIndicator, setShowIndicator] = useState(false);
   const channelRefs = useRef<Record<string, HTMLLIElement | null>>({});

   const animatable = useRef<AnimatableObject>(null);

   const sortedChannels = useMemo(
      () =>
         props.channels?.toSorted((a, b) => {
            const aId = BigInt(a.lastMessageId || a.id);
            const bId = BigInt(b.lastMessageId || b.id);

            // Sort in descending order (newest first)
            return aId > bId ? -1 : aId < bId ? 1 : 0;
         }),
      [props.channels],
   );

   useEffect(() => {
      animatable.current = createAnimatable(indicator.current!, { y: 0, height: 0, scaleY: 1, left: 0 });

      return () => {
         animatable.current?.revert();
      };
   }, []);

   // Update indicator position when selected channel changes
   useEffect(() => {
      if (!animatable.current) return;

      if (channelId && channelRefs.current[channelId]) {
         const element = channelRefs.current[channelId];
         const offsetTop = element.offsetTop;
         const height = element.offsetHeight;

         if (!showIndicator) {
            console.log(animatable.current.scaleY());
            animatable.current.y(offsetTop, 0);
         } else {
            animatable.current.y(offsetTop, 200);
         }

         setShowIndicator(true);
         animatable.current.left(0, 200).height(height, 200);
      } else {
         setShowIndicator(false);
         animatable.current.left(-4, 200);
      }
   }, [channelId, sortedChannels]);

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
         <ul className="scroll-super-thin relative flex h-full flex-col overflow-x-hidden overflow-y-scroll">
            <div ref={indicator} className={clsx("bg-primary-600 pointer-events-none absolute left-0 w-1 origin-center rounded-r")} />
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
                  <DirectMessageChannel
                     key={channel.id}
                     ref={(el) => {
                        if (el) {
                           channelRefs.current[channel.id] = el;
                        }
                     }}
                     channel={channel}
                  />
               ))}
            </div>
         </ul>
         <VoiceStatus />
      </nav>
   );
}
