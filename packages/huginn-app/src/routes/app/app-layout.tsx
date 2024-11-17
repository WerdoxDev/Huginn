import clsx from "clsx";
import { Outlet } from "react-router";

export default function Layout() {
	const [backgroundState, setBackgroundState] = useState(2);
	const appWindow = useWindow();

	return (
		<AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
			<div className={clsx("absolute inset-0", appWindow.environment === "desktop" && "top-6")}>
				<Outlet />
			</div>
		</AuthBackgroundContext.Provider>
	);
}
