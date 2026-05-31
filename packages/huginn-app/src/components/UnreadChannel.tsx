import type { RefObject } from "react";

import { useChannel, useChannelRecipients } from "@hooks/api-hooks/channelHooks";
import { ChannelType, type Snowflake } from "@huginn/shared";
import { Link } from "@tanstack/react-router";

import AttentionIndicator from "./AttentionIndicator";
import ChannelIcon from "./ChannelIcon";
import Tooltip from "./tooltip/Tooltip";
import UserAvatar from "./UserAvatar";

export default function UnreadChannel(props: { channelId: Snowflake; unreadCount: number; className?: string; ref?: RefObject<HTMLDivElement> }) {
   const channel = useChannel(props.channelId);
   const { recipients } = useChannelRecipients(channel?.id);

   if (!channel) {
      return null;
   }

   return (
      <Tooltip>
         <Tooltip.Trigger asChild>
            <Link
               className="relative mt-3 flex items-center rounded-lg"
               to="/channels/@me/$channelId"
               params={{ channelId: channel.id }}
               preload="intent"
            >
               {channel.type === ChannelType.DM ? (
                  <UserAvatar userId={recipients[0]?.id} avatarHash={recipients[0]?.avatar} size={3} hideStatus />
               ) : (
                  <ChannelIcon channelId={channel?.id} iconHash={channel?.icon} size={3} />
               )}
               {/* <div className="size-8 bg-white rounded-full"></div> */}
               <AttentionIndicator className="right-0 bottom-0">{props.unreadCount}</AttentionIndicator>
            </Link>
         </Tooltip.Trigger>
         <Tooltip.Content side="right">{channel.name}</Tooltip.Content>
      </Tooltip>
   );
}
