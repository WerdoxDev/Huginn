import { Link, Outlet, createFileRoute, useParams } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me")({
   component: Component,
});

function Component() {
   const params = useParams({ strict: false });

   return params.channelId ? (
      <Outlet />
   ) : (
      <div className="flex h-full flex-col">
         <div className="flex h-full items-center justify-center">
            <div className="text-text flex flex-col items-center text-center">
               <IconFa6SolidCrow className="text-accent mb-2.5 size-20 transition-transform hover:-rotate-12 hover:scale-105 active:rotate-6" />
               <div className="mb-2.5 text-2xl font-bold">Welcome to Huginn</div>
               <div>
                  Start by adding your friends in the{" "}
                  <Link to="/friends" className="text-accent font-bold">
                     FRIENDS
                  </Link>{" "}
                  section
               </div>
            </div>
         </div>
         <div className="bg-background flex h-16 w-full flex-shrink-0" />
      </div>
   );
}
