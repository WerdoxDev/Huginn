import { Outlet, useRouter } from "@tanstack/react-router";

export default function RouteErrorComponent(props: { error: unknown }) {
	const handleError = useErrorHandler();
	const router = useRouter();

	useEffect(() => {
		handleError(props.error);
		router.history.go(-1);
	}, []);

	return <Outlet />;
}
