import { animated, useInView } from "@react-spring/web";
import { Outlet, getRouterContext, useRouter } from "@tanstack/react-router";
import cloneDeep from "lodash.clonedeep";

export default function AnimatedOutlet(props: {
	updateFor?: string[];
	style: Record<string, unknown>;
	className?: string;
}) {
	const router = useRouter();
	const RouterContext = getRouterContext();
	const [renderedContext, setRenderedContext] = useState(() => router);

	const [ref, inView] = useInView();

	useEffect(() => {
		if (inView) {
			setRenderedContext(cloneDeep(router));
		}
	}, [inView]);

	useEffect(() => {
		const unsubscribe = router.subscribe("onResolved", ({ pathChanged }) => {
			if (!pathChanged) return;

			if (
				props.updateFor?.includes(router.state.location.pathname) &&
				(!routeHistory.lastPathname || props.updateFor.includes(routeHistory.lastPathname))
			) {
				setRenderedContext(cloneDeep(router));
			} else if (
				props.updateFor &&
				!props.updateFor.includes(router.state.location.pathname) &&
				routeHistory.lastPathname &&
				!props.updateFor.includes(routeHistory.lastPathname)
			) {
				setRenderedContext(cloneDeep(router));
			}
		});

		return () => {
			unsubscribe();
		};
	}, []);

	return (
		<animated.div ref={ref} style={props.style} className={props.className}>
			<RouterContext.Provider value={renderedContext}>
				<Outlet />
			</RouterContext.Provider>
		</animated.div>
	);
}
