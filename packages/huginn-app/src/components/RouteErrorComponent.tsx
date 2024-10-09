import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { Outlet, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

export default function RouteErrorComponent(props: { error: unknown }) {
	const handleError = useErrorHandler();
	const router = useRouter();

	useEffect(() => {
		handleError(props.error);
		router.history.go(-1);
	}, []);

	return <Outlet />;
}
