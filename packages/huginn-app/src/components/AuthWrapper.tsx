import clsx from "clsx";
import type { ReactNode } from "react";
import { Link, useLocation, useViewTransitionState } from "react-router";

export default function AuthWrapper(props: {
	className?: string;
	children?: ReactNode;
	hidden: boolean;
	onSubmit?: () => void;
	transitionName?: string;
}) {
	// const style = useSpring({
	// 	opacity: props.hidden ? 0 : 1,
	// 	transform: props.hidden ? "scale(0.75,0.75)" : "scale(1,1)",
	// 	config: { duration: 250, easing: easings.easeInOutQuad },
	// });

	// const isTransitioning = [useViewTransitionState("/login"), useViewTransitionState("/register"), useViewTransitionState("/oauth-redirect")].some(
	// 	(x) => x === true,
	// );
	const isTransitioning = [useViewTransitionState("/login"), useViewTransitionState("/register"), useViewTransitionState("/oauth-redirect")].some(
		(x) => x === true,
	);

	useEffect(() => {
		console.log(isTransitioning);
	}, [isTransitioning]);

	return (
		<form
			id={props.hidden ? "auth-form-hidden" : "auth-form"}
			onSubmit={(e) => {
				e.preventDefault();
				props.onSubmit?.();
			}}
			className={clsx(
				"group/wrapper relative flex w-96 flex-col items-start rounded-lg bg-background p-5 shadow-xl transition-shadow hover:shadow-2xl",
				props.className,
			)}
			style={isTransitioning ? { viewTransitionName: props.transitionName } : undefined}
		>
			{props.children}
		</form>
	);
}
