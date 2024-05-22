import { ChannelType, DirectChannel } from "@shared/api-types";
import { Link, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import UserIconWithStatus from "./UserIconWithStatus";

export default function DirectMessageChannel(props: { channel: DirectChannel; onSelected?: () => void }) {
   const { channelId } = useParams({ strict: false });

   const selected = useMemo(() => channelId == props.channel.id, [channelId, props.channel]);
   const name = useMemo(
      () => (props.channel.type === ChannelType.DM ? props.channel.recipients[0].username : props.channel.name),
      [props.channel],
   );
   return (
      <li
         className={`group my-0.5 cursor-pointer rounded-md hover:bg-background active:bg-white active:bg-opacity-10 ${selected && "bg-white bg-opacity-10"}`}
         onClick={() => props.onSelected && props.onSelected()}
      >
         <Link className="flex items-center p-1.5" to={`/channels/@me/${props.channel.id}`}>
            <UserIconWithStatus className="mr-3 bg-tertiary" />
            <div className={`w-full text-base text-text group-hover:opacity-100 ${selected ? "opacity-100" : "opacity-70"}`}>
               {name}
            </div>
            {/* <Transition name="slide-right-single">
            <Icon v-if="state" class="flex-shrink-0 text-text" name="svg-spinners:3-dots-fade" size="30" />
         </Transition> */}
         </Link>
      </li>
   );
}
