import clsx from "clsx";

export default function LoadingDot(props: { loadingClassName?: string; className?: string }) {
	return (
		<div className={clsx("flex items-center justify-center gap-x-0.5", props.className)}>
			<div className={clsx("loading-dot rounded-full bg-white", props.loadingClassName)} />
			<div className={clsx("loading-dot rounded-full bg-white", props.loadingClassName)} />
			<div className={clsx("loading-dot rounded-full bg-white", props.loadingClassName)} />
		</div>
	);
}
