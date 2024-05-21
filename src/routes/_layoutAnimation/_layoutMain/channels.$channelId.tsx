import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "../../../lib/middlewares";
import { useContext, useEffect } from "react";
import { AuthBackgroundContext } from "../../../contexts/authBackgroundContext";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/channels/$channelId")({
   beforeLoad() {
      requireAuth();
      // await new Promise((resolve) => {
      //    setTimeout(() => {
      //       resolve(true);
      //    }, 1000);
      // });
   },
   component: Channel,
   // loader: async ({ params }) => {
   //    return await client.channels.get(params.channelId);
   // },
   // staleTime: 10000,
   // preloadStaleTime: 10000,
});

function Channel() {
   // const data = useLoaderData({ from: "/channel/$channelId" });
   // const { data, isLoading, error } = useSWR(`/channels/${channelId}`, (key) => fetcher(key, channelId));
   const { setState: setBackgroundState } = useContext(AuthBackgroundContext);

   useEffect(() => {
      setBackgroundState(2);
   }, []);
   // if (isLoading) return <div>LOADING...</div>;
   // if (error) {
   //    console.log(error);
   //    return <div>ERRRRROR</div>;
   // }

   return (
      <div className="flex h-full flex-col">
         {/* ref to scroll */}
         <div className="h-full flex-shrink overflow-x-hidden overflow-y-scroll">
            {/* If messages */}
            <ol className="flex min-h-full flex-col items-stretch justify-end gap-y-2 p-3 pr-0.5">
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
