import clsx from "clsx";
import { Outlet } from "react-router";

export default function Layout() {
	const [backgroundState, setBackgroundState] = useState(2);
	const appWindow = useWindow();
	const isTransitioning = useMainViewTransitionState();

	return (
		<AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
			<div
				className={clsx("absolute inset-0 bg-secondary", appWindow.environment === "desktop" && "top-6")}
				style={isTransitioning ? { viewTransitionName: "auth" } : undefined}
			>
				<AuthBackgroundSvg state={backgroundState} />
				<Outlet />
			</div>
		</AuthBackgroundContext.Provider>
	);
}
