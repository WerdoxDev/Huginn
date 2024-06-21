import { useClient } from "@contexts/apiContext";
import { DirectChannel } from "@shared/api-types";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import UserIconWithStatus from "./UserIconWithStatus";
import { useChannelName } from "@hooks/useChannelName";

export default function DirectMessageChannel(props: { channel: DirectChannel; onSelected?: () => void }) {
   const client = useClient();
   const navigate = useNavigate();
   const router = useRouter();

   const { channelId } = useParams({ strict: false });

   const selected = useMemo(() => channelId == props.channel.id, [channelId, props.channel]);

   const name = useChannelName(props.channel);

   const mutation = useMutation({
      async mutationFn() {
         await client.channels.removeDm(props.channel.id);
      },
      async onSuccess() {
         if (router.state.location.pathname.includes(props.channel.id)) {
            await navigate({ to: "/channels/@me" });
         }
      },
   });

   async function deleteChannel() {
      await mutation.mutateAsync();
   }

   useEffect(() => {
      console.log(props.channel);
   }, [props.channel]);

   return (
      <li
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
            onClick={deleteChannel}
         >
            <IconMdiClose className="text-text/50 group-hover/close:text-text/100" />
         </button>
      </li>
   );
}
