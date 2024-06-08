import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me")({
   component: Component,
});

function Component() {
   return <Outlet />;
}
