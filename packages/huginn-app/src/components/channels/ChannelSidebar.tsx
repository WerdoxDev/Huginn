import type { ReactNode } from "react";

import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginnjs/shared";
import { useSidebarStore } from "@stores/sidebarStore";
import { AnimatePresence, motion, useIsPresent } from "motion/react";

import type { AppDirectChannel, ChannelSidebarPanel } from "@/types";

import ChannelRecipientsPanel from "./ChannelRecipientsPanel";
import ChannelSearchPanel from "./ChannelSearchPanel";

const panels: Record<ChannelSidebarPanel, { width: number; label: string }> = {
   members: { width: 240, label: "Channel members" },
   search: { width: 400, label: "Search messages" },
};

const resizeTransition = { duration: 0.15, ease: "easeInOut" } as const;

export default function ChannelSidebar(props: { channel: AppDirectChannel; onClose: () => void }) {
   const { isRightOpen, rightPanel } = useSidebarStore();
   const isMobile = useIsMobile();
   const panel = panels[rightPanel];
   const isOpen = isRightOpen && (rightPanel !== "members" || props.channel.type === ChannelType.GROUP_DM);
   const contentWidth = isMobile ? `min(${panel.width}px, calc(100vw - 16px))` : panel.width;

   return (
      <motion.div
         inert={!isOpen}
         initial={false}
         animate={{
            width: isMobile || isOpen ? contentWidth : 0,
            x: isMobile && !isOpen ? "100%" : 0,
         }}
         transition={resizeTransition}
         className="top-topbar-separator fixed inset-y-0 right-0 z-40 shrink-0 overflow-hidden lg:relative lg:top-0 lg:h-full"
         onKeyDown={(event) => {
            if (event.key === "Escape") {
               event.stopPropagation();
               props.onClose();
            }
         }}
      >
         <div className="bg-surface-alt absolute inset-0">
            <AnimatePresence initial={false} mode="popLayout">
               {isOpen && (
                  <SidebarContent key={`${props.channel.id}:${rightPanel}`} width={contentWidth}>
                     {rightPanel === "members" ? (
                        <ChannelRecipientsPanel channel={props.channel} />
                     ) : (
                        <ChannelSearchPanel channel={props.channel} onClose={props.onClose} />
                     )}
                  </SidebarContent>
               )}
            </AnimatePresence>
         </div>
      </motion.div>
   );
}

function SidebarContent(props: { children: ReactNode; width: number | string }) {
   const isPresent = useIsPresent();

   return (
      <motion.div
         inert={!isPresent}
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         transition={{ duration: 0.15, ease: "easeInOut" }}
         style={{ width: props.width }}
         className="bg-surface-alt border-surface absolute inset-y-0 right-0 overflow-hidden border-l-2"
      >
         {props.children}
      </motion.div>
   );
}
