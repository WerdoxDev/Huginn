import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { useEffect } from "react";
import { Outlet, useNavigate, useRouteError } from "react-router";

export default function RouteErrorComponent() {
	const error = useRouteError();
	const handleError = useErrorHandler();
	const navigate = useNavigate();

	useEffect(() => {
		console.log(error);
		handleError(error);
		navigate(-1);
	}, []);

	return <Outlet />;
}
