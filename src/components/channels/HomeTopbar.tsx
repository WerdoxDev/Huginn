import UserIconWithStatus from "@components/UserIconWithStatus";
import { useChannelName } from "@hooks/useChannelName";
import { APIDMChannel, APIGroupDMChannel, ChannelType } from "@shared/api-types";

export default function HomeTopbar(props: { channel: APIDMChannel | APIGroupDMChannel }) {
   const name = useChannelName(props.channel);

   return (
      <div className="flex h-[4.75rem] flex-shrink-0 items-center bg-tertiary px-6">
         <div className="flex items-center">
            {props.channel.type === ChannelType.DM ? (
               <UserIconWithStatus className="mr-3 bg-background" />
            ) : (
               <div className="mr-3 size-[2.25rem] rounded-full bg-background"></div>
            )}
            <div className="text-text">{name}</div>
         </div>
      </div>
   );
}
