import type { MouseEvent } from "react";

import MobileMenuButton from "@components/button/MobileMenuButton";
import TopBarButton from "@components/button/TopBarButton";
import TopBar from "@components/TopBar";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginn/shared";
import { useMobileMenuStore } from "@stores/mobileMenuStore";

import type { AppDirectChannel } from "@/types";

import ChannelName from "./ChannelName";
import PinnedMessagesPopover from "./PinnedMessagesPopover";

export default function ChannelWithIdTopBar(props: {
   channel: AppDirectChannel;
   onRecipientsClick?: (e: MouseEvent) => void;
   onCallClick?: (e: MouseEvent) => void;
   onClick?: (e: MouseEvent) => void;
}) {
   const { isRightOpen, resetToCenter } = useMobileMenuStore();
   const isMobile = useIsMobile();

   function handleBack() {
      resetToCenter();
   }

   return (
      <TopBar>
         {isMobile &&
            (isRightOpen ? (
               <TopBarButton onClick={handleBack} className="mr-3">
                  <IconMingcuteLeftFill className="size-topbar-icon" />
               </TopBarButton>
            ) : (
               <MobileMenuButton />
            ))}
         <ChannelName />
         {/* {(!isMobile || !isRightOpen) && ( */}
         <div className="ml-auto flex gap-x-5">
            <TopBarButton tooltip="Start Call" onClick={props.onCallClick}>
               <IconMingcutePhoneCallFill className="size-topbar-icon" />
            </TopBarButton>
            <PinnedMessagesPopover channelId={props.channel.id} />
            {props.channel.type === ChannelType.GROUP_DM && (
               <TopBarButton tooltip="Toggle Members" onClick={props.onRecipientsClick}>
                  <IconMingcuteGroup2Fill className="size-topbar-icon" />
               </TopBarButton>
            )}
         </div>
         {/* )} */}
      </TopBar>
   );
}
