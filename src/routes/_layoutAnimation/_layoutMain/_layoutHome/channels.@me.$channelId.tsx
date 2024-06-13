import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import ChannelMessages from "../../../../components/channels/ChannelMessages";
import { getMessagesOptions } from "../../../../lib/queries";
import ModalErrorComponent from "../../../../components/ModalErrorComponent";
import { useClient } from "../../../../contexts/apiContext";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
   component: Component,
   loader: ({ params, context: { queryClient, client } }) => {
      return queryClient.ensureQueryData(getMessagesOptions(client, params.channelId));
   },
   errorComponent: ModalErrorComponent,
});

function Component() {
   const client = useClient();
   const { channelId } = Route.useParams();
   const { data: messages } = useSuspenseQuery(getMessagesOptions(client, channelId));
   return <ChannelMessages channelId={channelId} messages={messages} />;
}
