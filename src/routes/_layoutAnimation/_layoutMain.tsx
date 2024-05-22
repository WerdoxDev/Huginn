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
               <Outlet />
            </div>
         </div>
      </div>
   );
}
