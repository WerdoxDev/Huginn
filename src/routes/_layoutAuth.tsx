import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAuth")({
   component: () => (
      <div>
         <Outlet />
      </div>
   ),
});
