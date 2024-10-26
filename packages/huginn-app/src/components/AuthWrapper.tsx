import { animated, easings, useSpring } from "@react-spring/web";
import clsx from "clsx";
import type { ReactNode } from "react";

export default function AuthWrapper(props: { className?: string; children?: ReactNode; hidden: boolean; onSubmit?: () => void }) {
	const style = useSpring({
		opacity: props.hidden ? 0 : 1,
		transform: props.hidden ? "translateY(-120px)" : "translateY(0px)",
		config: { duration: 250, easing: easings.easeInOutCirc },
	});

	return (
		<animated.form
			onSubmit={(e) => {
				e.preventDefault();
				props.onSubmit?.();
			}}
			style={style}
			className={clsx("flex w-96 flex-col items-start rounded-lg bg-background p-5 shadow-xl transition-shadow hover:shadow-2xl", props.className)}
		>
			{props.children}
		</animated.form>
	);
}
