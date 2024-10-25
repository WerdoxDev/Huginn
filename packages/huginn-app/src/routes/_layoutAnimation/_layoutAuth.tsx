import { animated, easings, useSpring, useTransition } from "@react-spring/web";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import clsx from "clsx";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth")({
	component: LayoutAuth,
});

function LayoutAuth() {
	const router = useRouter();
	const { state: backgroundState } = useContext(AuthBackgroundContext);
	const transitions = useTransition(router.state.location.pathname, {
		from: { opacity: 0, transform: "translateY(-120px)" },
		enter: { opacity: 1, transform: "translateY(0px)" },
		leave: { opacity: 0, transform: "translateY(-120px)" },
		config: { duration: 250, easing: easings.easeInOutCirc },
	});

	const modalsDispatch = useModalsDispatch();

	const style = useSpring({
		background: backgroundState === 2 ? "rgba(38,38,38,0)" : "rgba(38,38,38,1)",
		config: { duration: 250 },
		immediate: !routeHistory.lastPathname,
	});

	return (
		<animated.div style={style} className={clsx("absolute inset-0 z-10", backgroundState === 2 && "pointer-events-none")}>
			<AuthBackgroundSvg state={backgroundState} />
			<div className={clsx("absolute inset-0 select-none transition-all duration-500", backgroundState === 1 ? "opacity-100" : "opacity-0")}>
				<div className="flex h-full flex-col items-center justify-center">
					<IconFa6SolidCrow className="size-20 animate-pulse text-text drop-shadow-[0px_0px_50px_rgb(var(--color-text))]" />
					<div className="mt-2 flex items-center justify-center gap-x-2 text-text/80 text-xl">
						Loading
						<LoadingIcon />
					</div>
				</div>
			</div>
			{transitions((style) => (
				<AnimatedOutlet style={style} className="absolute flex h-full w-full items-center justify-center" />
			))}
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
		</animated.div>
	);
}
