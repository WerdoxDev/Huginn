import ChannelIcon from "@components/ChannelIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useIsMobile } from "@hooks/useIsMobile";
import { ChannelType } from "@huginn/shared";
import { usePresences } from "@stores/presenceStore";
import { useThisUser } from "@stores/userStore";
import { useMemo } from "react";

export default function ChannelName() {
   const channel = useCurrentChannel();
   const { user } = useThisUser();
   const recipients = useUsers(channel?.recipientIds);
   const isMobile = useIsMobile();
   const { presences } = usePresences([...(channel?.recipientIds ?? []), user!.id]);

   const otherUsers = useMemo(() => recipients.filter((x) => x.id !== user?.id), [recipients]);

   if (!channel) return;

   return (
      <div className="flex items-center">
         {channel.type === ChannelType.DM ? (
            <UserAvatar userId={otherUsers[0]?.id} avatarHash={otherUsers[0]?.avatar} className="mr-3" />
         ) : (
            <ChannelIcon channelId={channel?.id} iconHash={channel?.icon} className="mr-3" />
         )}
         <Tooltip>
            <div className="flex flex-col justify-center">
               <Tooltip.Trigger className="text-text">{channel.name}</Tooltip.Trigger>
               {channel.type === ChannelType.GROUP_DM && (
                  <div className="text-text/50 text-xs">{presences.filter((x) => x.status === "online").length} Online</div>
               )}
            </div>
            {recipients.length === 1 && <Tooltip.Content>{recipients[0].username}</Tooltip.Content>}
         </Tooltip>
      </div>
   );
}
