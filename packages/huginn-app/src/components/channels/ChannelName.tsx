import ChannelIcon from "@components/ChannelIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { usePresences } from "@stores/presenceStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

export default function ChannelName() {
   const channel = useCurrentChannel();
   const { user } = useThisUser();
   const recipients = useUsers(channel?.recipientIds);
   const isMobile = useIsMobile();
   const { presences } = usePresences([...(channel?.recipientIds ?? []), user!.id]);
   const { updateModals } = useModals();

   const otherUsers = useMemo(() => recipients.filter((x) => x.id !== user?.id), [recipients]);

   function handleClick() {
      if (channel?.type === ChannelType.DM && otherUsers[0]) {
         updateModals({ userProfile: { isOpen: true, userId: otherUsers[0].id } });
      }
   }

   if (!channel) return;

   const isDM = channel.type === ChannelType.DM;

   return (
      <div className="flex items-center">
         {isDM ? (
            <button type="button" className="cursor-pointer rounded-full" onClick={handleClick}>
               <UserAvatar userId={otherUsers[0]?.id} avatarHash={otherUsers[0]?.avatar} className="mr-3" />
            </button>
         ) : channel.type === ChannelType.GROUP_DM ? (
            <ChannelIcon channelId={channel?.id} iconHash={channel?.icon} className="mr-3" />
         ) : null}
         <Tooltip>
            <div className="flex flex-col justify-center">
               {isDM ? (
                  <button type="button" className="text-text cursor-pointer text-left hover:underline" onClick={handleClick}>
                     {channel.name}
                  </button>
               ) : (
                  <Tooltip.Trigger className="text-text text-left">{channel.name}</Tooltip.Trigger>
               )}
               {channel.type === ChannelType.GROUP_DM && (
                  <div className="text-text/50 text-xs">{presences.filter((x) => x.status === "online").length} Online</div>
               )}
            </div>
            {recipients.length === 1 && <Tooltip.Content>{recipients[0].username}</Tooltip.Content>}
         </Tooltip>
      </div>
   );
}
