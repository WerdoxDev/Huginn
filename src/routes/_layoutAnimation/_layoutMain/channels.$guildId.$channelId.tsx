import { createFileRoute } from "@tanstack/react-router";
import { client } from "../../../lib/api";
import { requireAuth } from "../../../lib/middlewares";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/channels/$guildId/$channelId")({
   beforeLoad() {
      requireAuth();
   },
   component: ChannelMessages,
   loader: ({ params, context: { queryClient } }) => {
      return queryClient.ensureQueryData({
         queryKey: ["messages", params.channelId],
         queryFn: () => client.channels.getMessages(params.channelId, 50),
      });
   },
});

function ChannelMessages() {
   const data = Route.useLoaderData();
   // const { guildId, channelId } = Route.useParams();

   return (
      <div className="flex h-full flex-col">
         {/* ref to scroll */}
         <div className="h-full flex-shrink overflow-x-hidden overflow-y-scroll">
            {/* If messages */}
            <ol className="flex min-h-full flex-col items-stretch justify-end gap-y-2 p-3 pr-0.5">
               {data.length}
               {/* <BaseMessage v-for="message in messages" :key="message.id" :content="message.content" :author="message.author" /> */}
            </ol>
         </div>
         <div className="flex h-16 w-full flex-shrink-0 bg-background">
            {/* <MessageBox v-if="channelId" /> */}
            <div className="h-full w-64 flex-shrink-0" />
         </div>
      </div>
   );
}
