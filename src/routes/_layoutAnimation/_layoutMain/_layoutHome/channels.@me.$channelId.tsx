import { createFileRoute } from "@tanstack/react-router";
import ChannelMessages from "../../../../components/channels/ChannelMessages";
import { getMessagesOptions } from "../../../../lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useServerErrorHandler } from "../../../../hooks/useServerErrorHandler";
import { requireAuth } from "../../../../lib/middlewares";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
   beforeLoad() {
      requireAuth();
   },
   component: Component,
   loader: ({ params, context: { queryClient } }) => {
      return queryClient.ensureQueryData(getMessagesOptions(params.channelId));
   },
   errorComponent: ErrorComponent,
});

function ErrorComponent(props: { error: unknown }) {
   const handleServerError = useServerErrorHandler();

   useEffect(() => {
      handleServerError(props.error);
   }, []);
}

function Component() {
   const { channelId } = Route.useParams();
   const { data: messages } = useSuspenseQuery(getMessagesOptions(channelId));
   return <ChannelMessages channelId={channelId} messages={messages} />;
}
