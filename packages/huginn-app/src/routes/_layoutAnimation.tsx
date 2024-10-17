import { useTransition } from "@react-spring/web";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";

export const Route = createFileRoute("/_layoutAnimation")({
	component: LayoutAnimation,
});

function LayoutAnimation() {
	const { id, updateFor } = useRouteAnimation("/login", "/register");
	const [backgroundState, setBackgroundState] = useState(2);

	const appWindow = useWindow();

	const transitions = useTransition(id, {
		from: { dummy: 0 },
		enter: { dummy: 1 },
		leave: { dummy: 0 },
		config: { duration: 500 },
	});

	return (
		<AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
			{transitions((style) => (
				<AnimatedOutlet
					updateFor={updateFor}
					style={style}
					className={clsx("absolute inset-0", appWindow.environment === "desktop" && "top-6")}
					test="animation"
				/>
				// <div className="absolute inset-0 top-6">
				//    <Outlet />
				// </div>
			))}
		</AuthBackgroundContext.Provider>
	);
}
