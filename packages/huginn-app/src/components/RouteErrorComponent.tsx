import { Outlet, useNavigate, useRouteError } from "react-router";

export default function RouteErrorComponent() {
	const error = useRouteError();
	const handleError = useErrorHandler();
	const navigate = useNavigate();

	useEffect(() => {
		handleError(error);
		navigate(-1);
	}, []);

	return <Outlet />;
}
