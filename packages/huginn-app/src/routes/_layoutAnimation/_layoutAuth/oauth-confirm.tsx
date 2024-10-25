import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth/oauth-confirm")({
	component: OAuthConfirm,
});

function OAuthConfirm() {
	const { setState: setAuthBackgroundState } = useContext(AuthBackgroundContext);

	useEffect(() => {
		setAuthBackgroundState(0);
	}, []);

	return <AuthWrapper hidden={false}>HI!!!</AuthWrapper>;
}
