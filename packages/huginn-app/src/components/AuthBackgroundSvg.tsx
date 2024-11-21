import clsx from "clsx";

export default function AuthBackgroundSvg(props: { state: number }) {
	const colorTheme = useTheme();
	const fillColor = useMemo(() => colorTheme.accent2, [colorTheme]);
	const isTransitioning = useMainViewTransitionState();

	const path1 = {
		close: "M0 540.8C-100.8 530.3 -201.6 519.7 -270.4 468.4C-339.2 417 -376 324.9 -415.7 240C-455.4 155.1 -498.1 77.6 -540.8 0L0 0Z",
		open: "M0 324.5C-55.6 314.6 -111.2 304.7 -161 278.9C-210.8 253.1 -254.7 211.4 -281 162.2C-307.3 113.1 -315.9 56.6 -324.5 0L0 0Z",
		initial: "M0 0C0 0 0 0 0 0C0 0 0 0 0 0C0 0 0 0 0 0L0 0Z",
	};

	const path2 = {
		close: "M0 -540.8C101.2 -530.5 202.3 -520.1 270.4 -468.4C338.5 -416.6 373.5 -323.5 413.1 -238.5C452.7 -153.5 496.7 -76.8 540.8 0L0 0Z",
		open: "M0 -324.5C57 -316.2 114 -307.8 162.2 -281C210.4 -254.2 249.8 -208.9 275.4 -159C301 -109.1 312.7 -54.5 324.5 0L0 0Z",
		initial: "M0 0C0 0 0 0 0 0C0 0 0 0 0 0C0 0 0 0 0 0L0 0Z",
	};

	return (
		<>
			<svg
				className={clsx("pointer-events-none absolute h-full w-full", props.state === 1 && "z-10")}
				viewBox="0 0 960 540"
				xmlns="http://www.w3.org/2000/svg"
				version="1.1"
				preserveAspectRatio="xMidYMid slice"
				style={isTransitioning ? { viewTransitionName: "auth-background" } : undefined}
			>
				<title>animated-background</title>
				<g transform="translate(960, 0)">
					<path
						fill={fillColor}
						className="transition-all duration-500"
						d={props.state === 0 ? path1.open : props.state === 1 ? path1.close : path1.initial}
					/>
				</g>
				<g transform="translate(0, 540)">
					<path
						fill={fillColor}
						className="transition-all duration-500"
						d={props.state === 0 ? path2.open : props.state === 1 ? path2.close : path2.initial}
					/>
				</g>
			</svg>
		</>
	);
}
