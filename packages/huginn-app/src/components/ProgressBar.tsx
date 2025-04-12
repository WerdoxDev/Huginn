import type { ProgressBarProps } from "@/types";
import clsx from "clsx";
import { useEffect, useRef } from "react";

export default function ProgressBar(props: ProgressBarProps) {
	const progressRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const controller = new AbortController();

		document.addEventListener(
			"mousemove",
			(e) => {
				if (props.dragging) setPercentageFromMouse(props.orientation === "horizontal" ? e.pageX : e.pageY);
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"mouseup",
			() => {
				console.log("MOUSE UP");
				props.setDragging(false);
			},
			{ signal: controller.signal },
		);

		return () => {
			controller.abort();
		};
	}, [props.dragging, props.orientation, props.percentage]);

	function setPercentageFromMouse(mousePosition: number) {
		if (!progressRef.current) {
			return;
		}

		const rect = progressRef.current.getBoundingClientRect();

		const position = (props.orientation === "horizontal" ? mousePosition - rect.left : rect.bottom - mousePosition) + (props.mouseOffset ?? 0);

		const offset = props.startOffset ?? 0;
		const endOffset = 100 - (props.endOffset ?? 0);
		let percentage = (position / (props.orientation === "horizontal" ? rect.width : rect.height)) * 100;
		percentage = Math.max(0, percentage - offset);
		percentage = Math.min(endOffset, percentage);

		let actualPercentage = (percentage / (endOffset - offset)) * 100;
		actualPercentage = Math.max(0, Math.min(100, actualPercentage));

		percentage = Math.max(percentage + offset, offset);
		percentage = Math.min(endOffset, percentage);

		props.onPercentageChange?.(actualPercentage);
		props.setPercentage(percentage);
	}

	return (
		<div
			id={props.id}
			className={clsx(
				"group/progress relative flex h-2 cursor-pointer items-center rounded-md bg-white/20",
				props.orientation === "vertical" ? "h-full flex-col justify-end" : "w-full",
				props.className,
			)}
			onClick={(e) => setPercentageFromMouse(props.orientation === "horizontal" ? e.pageX : e.pageY)}
			onMouseDown={(e) => {
				console.log("true");
				props.setDragging(true);
				e.preventDefault();
			}}
			ref={progressRef}
		>
			<div
				className="absolute rounded-md bg-white/30 transition-[width]"
				style={{
					width: props.orientation === "horizontal" ? `${props.bufferPercentage}%` : "100%",
					height: props.orientation === "vertical" ? `${props.bufferPercentage}%` : "100%",
				}}
			/>
			<div
				className="absolute rounded-md bg-accent"
				style={{
					width: props.orientation === "horizontal" ? `${props.percentage}%` : "100%",
					height: props.orientation === "vertical" ? `${props.percentage}%` : "100%",
				}}
			/>
			<div
				className={clsx(
					"absolute h-3 w-3 scale-0 rounded-full bg-text transition-transform",
					props.dragging ? "scale-100" : "group-hover/progress:scale-100",
				)}
				style={{
					left: props.orientation === "horizontal" ? `calc(${props.percentage}% - ${6 + (props.mouseOffset ?? 0)}px` : "unset",
					bottom: props.orientation === "vertical" ? `calc(${props.percentage}% - ${6 + (props.mouseOffset ?? 0)}px)` : "unset",
				}}
			/>
		</div>
	);
}
