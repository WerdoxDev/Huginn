import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAuth")({
   component: () => <div>Hello /_layoutMain!</div>,
});
