import clsx from "clsx";
import type { ReactNode } from "react";
import { Outlet, useViewTransitionState } from "react-router";

export default function Layout() {
	const { state: backgroundState } = useContext(AuthBackgroundContext);
	// const transitions = useTransition(router.state.location.pathname, {
	//   from: { opacity: 0, transform: 'scale(0.75,0.75)' },
	//   enter: { opacity: 1, transform: 'scale(1,1)' },
	//   leave: { opacity: 0, transform: 'scale(0.75,0.75)' },
	//   config: { duration: 250, easing: easings.easeInOutSine },
	// })

	const modalsDispatch = useModalsDispatch();

	// const style = useSpring({
	//   background: backgroundState === 2 ? 'rgba(38,38,38,0)' : 'rgba(38,38,38,1)',
	//   config: { duration: 250 },
	//   immediate: !routeHistory.lastPathname,
	// })

	return (
		<div className={clsx("absolute inset-0", backgroundState === 2 && "pointer-events-none")}>
			<div className={clsx("absolute inset-0 select-none transition-all duration-500", backgroundState === 1 ? "opacity-100" : "opacity-0")}>
				<div className="flex h-full flex-col items-center justify-center">
					<IconFa6SolidCrow className="size-20 animate-pulse text-text drop-shadow-[0px_0px_50px_rgb(var(--color-text))]" />
					<div className="mt-2 flex items-center justify-center gap-x-2 text-text/80 text-xl">
						<span>Loading</span>
						<LoadingIcon />
					</div>
				</div>
			</div>
			{/* {transitions((style) => (
         <AnimatedOutlet
           style={style}
           className="absolute flex h-full w-full items-center justify-center"
         />
       ))} */}
			<div className="absolute flex h-full w-full items-center justify-center">
				<Outlet />
			</div>
			{backgroundState !== 2 && (
				<button
					type="button"
					className="absolute right-2.5 bottom-2.5 rounded-lg p-1 transition-all hover:bg-background"
					onClick={() => {
						modalsDispatch({ settings: { isOpen: true } });
					}}
				>
					<IconMingcuteSettings5Fill className="h-6 w-6 text-white/80 transition-all hover:rotate-[60deg]" />
				</button>
			)}
		</div>
	);
}
