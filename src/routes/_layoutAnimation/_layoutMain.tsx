import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain")({
   component: LayoutMain,
});

function LayoutMain() {
   useEffect(() => {
      return () => {
         console.log("UUUNMOUNT!!");
      };
   }, []);
   return (
      <div className="absolute inset-0 top-6 overflow-hidden">
         <div className="flex h-full w-full select-none bg-background">
            {/* <ChannelNavigation /> */}
            <div className="flex h-full w-full flex-col">
               <div className="flex h-full">
                  <div className="flex w-64 shrink-0 flex-col">
                     {/* <HomeSidebar v-if="isSelfGuild" /> */}
                     {/* <UserInfo /> */}
                  </div>
                  <div className="relative w-full bg-tertiary">
                     <Outlet />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
