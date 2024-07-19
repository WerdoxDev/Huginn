import { AnyRouter, Router, RouterProvider } from "@tanstack/react-router";
import { useClient } from "@contexts/apiContext";

export default function HuginnRouterProvider(props: {
   router: Router<AnyRouter["routeTree"], NonNullable<AnyRouter["options"]["trailingSlash"]>>;
}) {
   const client = useClient();

   return <RouterProvider router={props.router} context={{ client }} />;
}
