import { useSafeDeleteDMChannel } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { ChannelType } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import clsx from "clsx";
import { useMemo } from "react";
import { NavLink, useParams } from "react-router";
import type { AppDirectChannel } from "@/types";
import ChannelIcon from "./ChannelIcon";
import LoadingIcon from "./LoadingIcon";
import UserAvatar from "./UserAvatar";
import { usePresence } from "@stores/presenceStore";
import ActivityPreview from "./ActivityPreview";
import { useIsMobile } from "@hooks/useIsMobile";

export default function DirectMessageChannel(props: { channel: AppDirectChannel }) {
   const { open: openContextMenu, context, data } = useContextMenu("dm_channel");

   const recipients = useUsers(props.channel.recipientIds);
   const presence = usePresence(recipients[0]?.id);
   const { channelId } = useParams();
   const selected = useMemo(() => channelId === props.channel?.id, [channelId, props.channel]);

   const { tryMutate } = useSafeDeleteDMChannel(props.channel.id, props.channel.type, props.channel.name);

   return (
      <li
         onContextMenu={(e) => openContextMenu(props.channel, e)}
         className={clsx("group relative flex shrink-0 cursor-pointer overflow-hidden rounded-md")}
         data-context={context?.isOpen && data?.id === props.channel.id ? true : undefined}
      >
         <NavLink
            prefetch="intent"
            className={({ isActive, isPending }) =>
               clsx(
                  "hover:bg-surface active:bg-surface group-data-context:bg-surface flex w-full min-w-0 shrink items-center p-1.5",
                  (isPending || isActive) && "bg-white/10!",
               )
            }
            to={`/channels/@me/${props.channel.id}`}
         >
            {({ isPending }) => (
               <>
                  {props.channel.type === ChannelType.DM ? (
                     <UserAvatar userId={recipients[0].id} avatarHash={recipients[0]?.avatar} className="mr-3" />
                  ) : (
                     <ChannelIcon channelId={props.channel?.id} iconHash={props.channel?.icon} className="mr-3" />
                  )}
                  <div className="flex w-full flex-col justify-center overflow-hidden">
                     <div
                        className={clsx(
                           "text-text mr-8 overflow-hidden text-sm text-nowrap text-ellipsis group-hover:opacity-100 group-active:opacity-100 group-data-context:opacity-100",
                           selected ? "opacity-100" : "opacity-70",
                        )}
                     >
                        {props.channel.name}
                     </div>
                     {props.channel.type === ChannelType.GROUP_DM && (
                        <div
                           className={clsx(
                              "text-text text-xs group-hover:opacity-100 group-active:opacity-100 group-data-context:opacity-100",
                              selected ? "opacity-100" : "opacity-50",
                           )}
                        >
                           {recipients.length + 1} Members
                        </div>
                     )}
                     {props.channel.type === ChannelType.DM && (
                        <ActivityPreview
                           presence={presence}
                           className={clsx(
                              "group-hover:opacity-100 group-active:opacity-100 group-data-context:opacity-100",
                              selected ? "opacity-100" : "opacity-50",
                           )}
                        />
                     )}
                  </div>
                  {!isPending ? (
                     <button type="button" className="group/close mr-2 hidden shrink-0 cursor-pointer group-hover:block" onClick={tryMutate}>
                        <IconMingcuteCloseFill className="text-text/50 group-hover/close:text-text" />
                     </button>
                  ) : (
                     <div className="mr-2 flex shrink-0 items-center justify-center">
                        <LoadingIcon className="size-7" />
                     </div>
                  )}
               </>
            )}
         </NavLink>
      </li>
   );
}
