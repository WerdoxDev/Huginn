import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ChannelMessages from "../../../../components/channels/ChannelMessages";
import { getMessagesOptions } from "../../../../lib/queries";
import ModalErrorComponent from "../../../../components/ModalErrorComponent";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
   component: Component,
   loader: ({ params, context: { queryClient } }) => {
      return queryClient.ensureQueryData(getMessagesOptions(params.channelId));
   },
   errorComponent: ModalErrorComponent,
});

function Component() {
   const { channelId } = Route.useParams();
   const { data: messages } = useSuspenseQuery(getMessagesOptions(channelId));
   return <ChannelMessages channelId={channelId} messages={messages} />;
}
