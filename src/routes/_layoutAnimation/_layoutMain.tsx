import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain")({
   component: LayoutMain,
});

function LayoutMain() {
   return (
      <div className="absolute inset-0  overflow-hidden">
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
