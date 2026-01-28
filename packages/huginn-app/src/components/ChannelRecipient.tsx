import { useMutationLatestState } from "@hooks/useLatestMutationStatus";
import type { Snowflake } from "@huginn/shared";
import { useContextMenu } from "@stores/contextMenuStore";
import { usePresence } from "@stores/presenceStore";
import clsx from "clsx";
import LoadingIcon from "./LoadingIcon";
import Tooltip from "./tooltip/Tooltip";
import UserAvatar from "./UserAvatar";
import type { AppUser } from "@/types";
import ActivityPreview from "./ActivityPreview";
import { useIsMobile } from "@hooks/useIsMobile";
import type { MouseEvent } from "react";

export default function ChannelRecipient(props: { channelId: Snowflake; isOwner: boolean; recipient: AppUser }) {
   const presence = usePresence(props.recipient.id);
   const { open: openContextMenu, data, context } = useContextMenu("dm_channel_recipient");
   const state = useMutationLatestState("create-dm-channel_recipient");
   const isMobile = useIsMobile();

   function open(e: MouseEvent<HTMLDivElement>) {
      openContextMenu({ channelId: props.channelId, recipient: props.recipient }, e);
   }
   return (
      <div
         onContextMenu={open}
         onClick={isMobile ? open : undefined}
         className={clsx(
            "group/recipient hover:bg-surface active:bg-surface data-context:bg-surface relative flex cursor-pointer items-center gap-x-3 rounded-md p-1.5",
         )}
         data-context={context?.isOpen && data?.recipient.id === props.recipient.id ? true : undefined}
      >
         <UserAvatar
            userId={props.recipient.id}
            avatarHash={props.recipient.avatar}
            className={clsx(
               (!presence || presence?.status === "offline") && "opacity-30",
               "group-hover/recipient:opacity-100 group-active/recipient:opacity-100 group-data-context/recipient:opacity-100",
            )}
         />
         <div className="flex flex-col overflow-hidden">
            <div
               className={clsx(
                  presence && presence.status !== "offline" ? "text-text/70" : "text-text/30",
                  "group-hover/recipient:text-text group-active/recipient:text-text group-data-context/recipient:text-text text-sm",
               )}
            >
               {props.recipient.displayName}
            </div>
            <ActivityPreview
               presence={presence}
               className="opacity-50 group-hover/recipient:opacity-100 group-active/recipient:opacity-100 group-data-context/recipient:opacity-100"
            />
         </div>
         {state?.status === "pending" && state?.variables?.recipients.some((x) => x === props.recipient.id) ? (
            <div className="absolute top-3.5 right-2 bottom-3.5 flex shrink-0 items-center justify-center">
               <LoadingIcon className="size-7" />
            </div>
         ) : (
            props.isOwner && (
               <Tooltip>
                  <Tooltip.Trigger className="text-positive-100 mr-2 ml-auto">
                     <IconSolarSledgehammerBold className="size-5" />
                  </Tooltip.Trigger>
                  <Tooltip.Content>Channel Owner</Tooltip.Content>
               </Tooltip>
            )
         )}
      </div>
   );
}
