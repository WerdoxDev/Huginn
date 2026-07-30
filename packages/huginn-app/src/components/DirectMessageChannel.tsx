import { useSafeDeleteDMChannel } from "@hooks/api-hooks/channelHooks";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { ChannelType } from "@huginnjs/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { usePresence } from "@stores/presenceStore";
import { Link, useParams, useRouterState } from "@tanstack/react-router";
import clsx from "clsx";
import { useMemo, useState, type MouseEvent, type Ref } from "react";

import type { AppDirectChannel } from "@/types";

import ActivityPreview from "./ActivityPreview";
import ChannelIcon from "./ChannelIcon";
import LoadingIcon from "./LoadingIcon";
import UserAvatar from "./UserAvatar";

export default function DirectMessageChannel(props: { channel: AppDirectChannel; ref: Ref<HTMLLIElement>; pinned?: boolean }) {
   const { open: openContextMenu, context, data } = useContextMenu("dm_channel");

   const recipients = useUsers(props.channel.recipientIds);
   const presence = usePresence(recipients[0]?.id);
   const { channelId } = useParams({ strict: false }) as { channelId?: string };
   const selected = useMemo(() => channelId === props.channel?.id, [channelId, props.channel]);

   const { tryMutate } = useSafeDeleteDMChannel(props.channel.id, props.channel.type, props.channel.name);
   const state = useRouterState();

   const isLoading = state.isLoading && state.location.pathname === `/channels/@me/${props.channel.id}`;
   const [isHovered, setIsHovered] = useState(false);

   function handleLeave(e: MouseEvent) {
      e.preventDefault();
      tryMutate();
   }

   return (
      <li
         ref={props.ref}
         onContextMenu={(e) => openContextMenu(props.channel, e)}
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}
         className={clsx("group relative flex shrink-0 cursor-pointer overflow-hidden rounded-md")}
         data-context={context?.isOpen && data?.id === props.channel.id ? true : undefined}
      >
         <Link
            preload="intent"
            className={clsx(
               "group-data-context:bg-surface hover:bg-surface active:bg-surface flex w-full min-w-0 shrink items-center p-1.5",
               isLoading && "bg-white/10!",
            )}
            activeProps={{ className: "bg-white/10" }}
            to="/channels/@me/$channelId"
            params={{ channelId: props.channel.id }}
         >
            {props.channel.type === ChannelType.DM ? (
               <UserAvatar userId={recipients[0].id} avatarHash={recipients[0]?.avatar} className="mr-3" animatedMode="hover" hovered={isHovered} />
            ) : (
               <ChannelIcon channelId={props.channel?.id} iconHash={props.channel?.icon} className="mr-3" animatedMode="hover" hovered={isHovered} />
            )}
            <div className="flex w-full flex-col justify-center overflow-hidden">
               <div
                  className={clsx(
                     "text-text mr-4 overflow-hidden text-sm text-nowrap text-ellipsis group-hover:opacity-100 group-active:opacity-100 group-data-context:opacity-100",
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
            {!isLoading ? (
               <div className="mr-2 flex shrink-0 items-center gap-x-2">
                  {props.pinned && <IconMingcutePinFill className="text-text/50 size-4 transition-opacity" />}
                  <button className="group/close ml-auto hidden cursor-pointer group-hover:block" onClick={handleLeave}>
                     <IconMingcuteCloseFill className="text-text/50 group-hover/close:text-text size-4" />
                  </button>
               </div>
            ) : (
               <div className="mr-2 flex shrink-0 items-center justify-center">
                  <LoadingIcon className="size-7" />
               </div>
            )}
         </Link>
      </li>
   );
}
