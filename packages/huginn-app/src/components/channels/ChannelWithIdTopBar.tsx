import type { MouseEvent } from "react";

import MobileMenuButton from "@components/button/MobileMenuButton";
import TopBarButton from "@components/button/TopBarButton";
import TopBar from "@components/TopBar";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useMobileMenuStore } from "@stores/mobileMenuStore";
import { useModals } from "@stores/modalsStore";
import { usePopover } from "@stores/popoverStore";

import type { AppDirectChannel } from "@/types";

import CurrentChannelInfo from "./CurrentChannelInfo";

export default function ChannelWithIdTopBar(props: {
   channel: AppDirectChannel;
   onRecipientsClick?: (e: MouseEvent) => void;
   onCallClick?: (e: MouseEvent) => void;
   onClick?: (e: MouseEvent) => void;
}) {
   const { isRightOpen, resetToCenter } = useMobileMenuStore();
   const isMobile = useIsMobile();
   const { toggle } = usePopover("pinned_messages");
   const client = useClient();
   const { updateModals } = useModals();

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
         <CurrentChannelInfo iconZoomable />
         {/* {(!isMobile || !isRightOpen) && ( */}
         <div className="ml-auto flex shrink-0 gap-x-5">
            <TopBarButton tooltip="Start Call" onClick={props.onCallClick}>
               <IconMingcutePhoneCallFill className="size-topbar-icon" />
            </TopBarButton>
            <TopBarButton tooltip="Pinned Messages" onClick={(e) => toggle(e, { channelId: props.channel.id })}>
               <IconMingcutePinFill className="size-topbar-icon" />
            </TopBarButton>
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
