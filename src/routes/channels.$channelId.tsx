import { Link, createFileRoute, useLoaderData } from "@tanstack/react-router";
import { client } from "../lib/api";
import { requireAuth } from "../lib/middlewares";

export const Route = createFileRoute("/channels/$channelId")({
   async beforeLoad() {
      await requireAuth();
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

   // if (isLoading) return <div>LOADING...</div>;
   // if (error) {
   //    console.log(error);
   //    return <div>ERRRRROR</div>;
   // }

   return (
      <div className="mt-10">
         {/* <div>{data?.name}</div> */}
         <Link to="/">CHANNELS</Link>
      </div>
   );
}
