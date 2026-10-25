import type { MouseEvent } from "react";

import MobileMenuButton from "@components/button/MobileMenuButton";
import TopBarButton from "@components/button/TopBarButton";
import TopBar from "@components/TopBar";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginnjs/shared";
import { usePopover } from "@stores/popoverStore";
import { useSidebarStore } from "@stores/sidebarStore";

import type { AppDirectChannel } from "@/types";

import CurrentChannelInfo from "./CurrentChannelInfo";

export default function ChannelWithIdTopBar(props: {
   channel: AppDirectChannel;
   onRecipientsClick?: (e: MouseEvent) => void;
   onCallClick?: (e: MouseEvent) => void;
   onSearchClick?: (e: MouseEvent) => void;
   onClick?: (e: MouseEvent) => void;
}) {
   const { isRightOpen, rightPanel, resetToCenter } = useSidebarStore();
   const isMobile = useIsMobile();
   const { toggle } = usePopover("pinned_messages");
   const isSidebarVisible = isRightOpen && (rightPanel === "search" || props.channel.type === ChannelType.GROUP_DM);

   function handleBack() {
      resetToCenter();
   }

   return (
      <TopBar>
         {isMobile &&
            (isSidebarVisible ? (
               <TopBarButton onClick={handleBack} className="mr-3">
                  <IconMingcuteLeftFill className="size-topbar-icon" />
               </TopBarButton>
            ) : (
               <MobileMenuButton />
            ))}
         <CurrentChannelInfo iconZoomable onMembersClick={props.onRecipientsClick} />
         <div className="ml-auto flex shrink-0 gap-x-5 lg:gap-x-5">
            <TopBarButton tooltip="Start Call" onClick={props.onCallClick}>
               <IconMingcutePhoneCallFill className="size-topbar-icon" />
            </TopBarButton>
            <TopBarButton tooltip="Pinned Messages" onClick={(e) => toggle(e, { channelId: props.channel.id })}>
               <IconMingcutePinFill className="size-topbar-icon" />
            </TopBarButton>
            <TopBarButton tooltip="Search Messages" onClick={props.onSearchClick} active={isRightOpen && rightPanel === "search"}>
               <IconMingcuteSearch2Fill className="size-topbar-icon" />
            </TopBarButton>
            {props.channel.type === ChannelType.GROUP_DM && (
               <TopBarButton tooltip="Toggle Members" onClick={props.onRecipientsClick} active={isRightOpen && rightPanel === "members"}>
                  <IconMingcuteGroup2Fill className="size-topbar-icon" />
               </TopBarButton>
            )}
         </div>
      </TopBar>
   );
}
