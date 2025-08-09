import HomeSidebar from "@components/HomeSidebar";
import UserInfo from "@components/UserInfo";
import { getChannelsOptions } from "@lib/queries";
import { clientStore, useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet } from "react-router";
import { queryClient } from "@/root";

export async function homeLoader() {
   const client = clientStore.getState().client;
   if (!client) {
      return;
   }

   return await queryClient?.ensureQueryData(getChannelsOptions(client, "@me"));
}

export default function HomeLayout() {
   const client = useClient();
   const { data } = useSuspenseQuery(getChannelsOptions(client!, "@me"));

   const { user } = useThisUser();

   return (
      //TODO: Abstract the 2 (navigation & content) parts to a central component for later use
      <div className="flex h-full w-full flex-col overflow-hidden">
         <div className="flex h-full">
            <div className="flex w-64 shrink-0 flex-col">
               <HomeSidebar channels={data} />
               {user && <UserInfo user={user} />}
            </div>
            <div className="bg-surface-deep relative w-full overflow-hidden">
               <Outlet />
            </div>
         </div>
      </div>
   );
}
