import { Outlet, createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "../../../lib/middlewares";
import { client } from "../../../lib/api";
import { useContext, useEffect, useMemo } from "react";
import HomeSidebar from "../../../components/HomeSidebar";
import { AuthBackgroundContext } from "../../../contexts/authBackgroundContext";
import GuildsBar from "../../../components/GuildsBar";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/channels/$guildId")({
   beforeLoad() {
      requireAuth();
   },
   component: Channels,
   loader: ({ params, context: { queryClient } }) => {
      if (params.guildId !== "@me") {
         //TODO: When guilds are actually a thing this needs to change!!!
         return;
      }

      return queryClient.ensureQueryData({
         queryKey: ["channels", params.guildId],
         queryFn: () => client.channels.getAll(),
      });
   },
});

function Channels() {
   const data = Route.useLoaderData();
   const { guildId } = Route.useParams();

   const { setState: setBackgroundState } = useContext(AuthBackgroundContext);

   const isSelfGuild = useMemo(() => guildId === "@me", [guildId]);

   useEffect(() => {
      setBackgroundState(2);
   }, []);

   return (
      <>
         <GuildsBar />
         <div className="flex h-full w-full flex-col">
            <div className="flex h-full">
               <div className="flex w-64 shrink-0 flex-col">
                  {isSelfGuild && <HomeSidebar channels={data} />}
                  {/* <UserInfo /> */}
               </div>
               <div className="relative w-full bg-tertiary">
                  <Outlet />
               </div>
            </div>
         </div>
      </>
   );
}
