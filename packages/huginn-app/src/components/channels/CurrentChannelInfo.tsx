import ChannelIcon from "@components/ChannelIcon";
import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { ChannelType } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useMobileMenuStore } from "@stores/mobileMenuStore";
import { useModals } from "@stores/modalsStore";
import { usePresences } from "@stores/presenceStore";
import { useThisUser } from "@stores/userStore";
import { clsx } from "clsx";
import { useMemo, type MouseEvent } from "react";

export default function CurrentChannelInfo(props: { iconZoomable?: boolean }) {
   const channel = useCurrentChannel();
   const client = useClient();
   const { user } = useThisUser();
   const recipients = useUsers(channel?.recipientIds);
   const { presences } = usePresences([...(channel?.recipientIds ?? []), user!.id]);
   const { updateModals } = useModals();
   const { toggleRight } = useMobileMenuStore();

   const otherUsers = useMemo(() => recipients.filter((x) => x.id !== user?.id), [recipients]);

   function handleClick() {
      if (channel?.type === ChannelType.DM && otherUsers[0]) {
         updateModals({ userProfile: { isOpen: true, userId: otherUsers[0].id } });
      } else {
         toggleRight();
      }
   }

   function handleIconClick(event: MouseEvent) {
      if (!props.iconZoomable || !client || !channel) return;

      const url =
         channel.type === ChannelType.GROUP_DM && channel.icon
            ? client.cdn.channelIcon(channel.id, channel.icon)
            : otherUsers[0].avatar
              ? client.cdn.avatar(otherUsers[0].id, otherUsers[0].avatar!)
              : undefined;

      if (!url) return;

      event.stopPropagation();

      updateModals({
         magnifiedMedia: {
            isOpen: true,
            url: url,
            filename: `${channel.name} icon`,
            width: 512,
            height: 512,
            type: "image",
         },
      });
   }

   if (!channel) return;

   const isDM = channel.type === ChannelType.DM;

   return (
      <div className="flex items-center overflow-hidden">
         <button
            type="button"
            className="group/icon mr-3 cursor-pointer rounded-full transition-opacity disabled:cursor-default"
            disabled={!props.iconZoomable}
            onClick={handleIconClick}
         >
            {isDM ? (
               <UserAvatar
                  userId={otherUsers[0]?.id}
                  avatarHash={otherUsers[0]?.avatar}
                  // className="mr-3"
                  innerClassName={clsx(props.iconZoomable && "transition-opacity group-hover/icon:opacity-50")}
               />
            ) : channel.type === ChannelType.GROUP_DM ? (
               channel.icon ? (
                  <ChannelIcon
                     channelId={channel.id}
                     iconHash={channel.icon}
                     innerClassName={clsx(props.iconZoomable && "transition-opacity group-hover/icon:opacity-50")}
                  />
               ) : (
                  <ChannelIcon channelId={channel.id} iconHash={channel.icon} className="" />
               )
            ) : null}
         </button>
         <button className="group mr-2 flex cursor-pointer flex-col justify-center overflow-hidden" onClick={handleClick}>
            {isDM ? (
               <div className="text-text truncate text-left group-hover:underline">{channel.name}</div>
            ) : (
               <div className="text-text truncate text-left">{channel.name}</div>
            )}
            {channel.type === ChannelType.GROUP_DM && (
               <div className="text-text/50 text-left text-xs">{presences.filter((x) => x.status === "online").length} Online</div>
            )}
         </button>
      </div>
   );
}
