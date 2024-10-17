import { useClient } from "@contexts/apiContext.tsx";
import { type AnyRouter, type Router, RouterProvider } from "@tanstack/react-router";

export default function HuginnRouterProvider(props: {
	router: Router<AnyRouter["routeTree"], NonNullable<AnyRouter["options"]["trailingSlash"]>>;
}) {
	const client = useClient();

	return <RouterProvider router={props.router} context={{ client }} />;
}
