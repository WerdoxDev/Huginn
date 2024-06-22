import { useChannelContextMenu } from "@contexts/contextMenuContext";
import { useChannelName } from "@hooks/useChannelName";
import { useRemoveChannel } from "@hooks/useDeleteChannel";
import { DirectChannel } from "@shared/api-types";
import { Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import UserIconWithStatus from "./UserIconWithStatus";

export default function DirectMessageChannel(props: { channel: DirectChannel; onSelected?: () => void }) {
   const openContextMenu = useChannelContextMenu();

   const removeChannel = useRemoveChannel();

   const { channelId } = useParams({ strict: false });
   const selected = useMemo(() => channelId == props.channel.id, [channelId, props.channel]);
   const name = useChannelName(props.channel);

   useEffect(() => {
      console.log(props.channel);
   }, [props.channel]);

   return (
      <li
         onContextMenu={(e) => openContextMenu(props.channel, e)}
         className={`group relative my-0.5 cursor-pointer rounded-md hover:bg-background active:bg-white active:bg-opacity-10 ${selected && "bg-white bg-opacity-10"}`}
         onClick={props.onSelected}
      >
         <Link className="flex items-center p-1.5" to={`/channels/@me/${props.channel.id}`}>
            <UserIconWithStatus className="mr-3 bg-tertiary" />
            <div className={`w-full text-sm text-text group-hover:opacity-100 ${selected ? "opacity-100" : "opacity-70"}`}>{name}</div>
            {/* <Transition name="slide-right-single">
            <Icon v-if="state" class="flex-shrink-0 text-text" name="svg-spinners:3-dots-fade" size="30" />
            </Transition> */}
         </Link>
         <button
            className="group/close invisible absolute bottom-3.5 right-2 top-3.5 flex-shrink-0 group-hover:visible"
            onClick={() => removeChannel(props.channel.id)}
         >
            <IconMdiClose className="text-text/50 group-hover/close:text-text/100" />
         </button>
      </li>
   );
}
