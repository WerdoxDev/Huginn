import { ContextMenuDMChannel, ContextMenuType } from "@/types";
import { useContextMenu } from "@contexts/contextMenuContext";
import { useUser } from "@contexts/userContext";
import { useDeleteDMChannel } from "@hooks/mutations/useDeleteDMChannel";
import { useChannelName } from "@hooks/useChannelName";
import { DirectChannel } from "@huginn/shared";
import { Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import UserAvatarWithStatus from "./UserAvatarWithStatus";

export default function DirectMessageChannel(props: { channel: DirectChannel; onSelected?: () => void }) {
   const { user } = useUser();

   const { open: openContextMenu } = useContextMenu<ContextMenuDMChannel>(ContextMenuType.DM_CHANNEL);

   const mutation = useDeleteDMChannel();

   const { channelId } = useParams({ strict: false });
   const selected = useMemo(() => channelId == props.channel.id, [channelId, props.channel]);
   const otherUsers = useMemo(() => props.channel.recipients.filter(x => x.id !== user?.id), [props.channel]);
   const name = useChannelName(props.channel);

   return (
      <li
         onContextMenu={e => {
            openContextMenu(props.channel, e);
         }}
         className={`hover:bg-background group relative my-0.5 cursor-pointer rounded-md active:bg-white active:bg-opacity-10 ${selected && "bg-white bg-opacity-10"}`}
         onClick={props.onSelected}
      >
         <Link className="flex items-center p-1.5" to={`/channels/@me/${props.channel.id}`}>
            <UserAvatarWithStatus userId={otherUsers[0].id} avatarHash={otherUsers[0].avatar} className="mr-3" />
            <div className={`text-text w-full text-sm group-hover:opacity-100 ${selected ? "opacity-100" : "opacity-70"}`}>{name}</div>
         </Link>
         <button
            className="group/close invisible absolute bottom-3.5 right-2 top-3.5 flex-shrink-0 group-hover:visible"
            onClick={() => {
               mutation.mutate(props.channel.id);
            }}
         >
            <IconMdiClose className="text-text/50 group-hover/close:text-text/100" />
         </button>
      </li>
   );
}
