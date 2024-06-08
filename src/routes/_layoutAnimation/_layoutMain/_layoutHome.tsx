import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, createFileRoute } from "@tanstack/react-router";
import HomeSidebar from "../../../components/HomeSidebar";
import UserInfo from "../../../components/UserInfo";
import { client } from "../../../lib/api";
import { getChannelsOptions } from "../../../lib/queries";
import { requireAuth } from "../../../lib/middlewares";
import ModalErrorComponent from "../../../components/ModalErrorComponent";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome")({
   beforeLoad() {
      requireAuth();
   },
   component: LayoutHome,
   loader: ({ context: { queryClient } }) => {
      return queryClient.ensureQueryData(getChannelsOptions("@me"));
   },
   errorComponent: ModalErrorComponent,
});

function LayoutHome() {
   const { data } = useSuspenseQuery(getChannelsOptions("@me"));

   return (
      //TODO: Abstract the 2 (navigation & content) parts to a central component for later use
      <div className="flex h-full w-full flex-col overflow-hidden">
         <div className="flex h-full ">
            <div className="flex w-64 shrink-0 flex-col">
               <HomeSidebar channels={data} />
               {client.user && <UserInfo user={client.user} />}
            </div>
            <div className="relative w-full overflow-hidden bg-tertiary">
               <Outlet />
            </div>
         </div>
      </div>
   );
}
