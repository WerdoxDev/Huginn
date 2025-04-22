import Tooltip from "@components/tooltip/Tooltip";
import clsx from "clsx";
import { type ReactNode, useEffect, useRef, useState } from "react";

export default function RangeInput(props: {
	className?: string;
	backgroundClassName?: string;
	fillClassName?: string;
	defaultValue?: number;
	minValue?: number;
	maxValue?: number;
	children?: ReactNode;
	onChange?: (value: number) => void;
	getTooltipText?: (value: number) => string;
}) {
	const rangeRef = useRef<HTMLDivElement>(null);
	const rangeTrackRef = useRef<HTMLDivElement>(null);
	const [percentage, setPercentage] = useState(props.defaultValue ?? 0);
	const isDragging = useRef(false);
	const isHovering = useRef(false);
	const [showTooltip, setShowTooltip] = useState(false);

	useEffect(() => {
		props.onChange?.(percentage);
	}, [percentage]);

	useEffect(() => {
		const controller = new AbortController();

		rangeRef.current?.addEventListener(
			"mousedown",
			(e) => {
				isDragging.current = true;
				setShowTooltip(true);
				updateRange(e.clientX);
			},
			{ signal: controller.signal },
		);

		rangeRef.current?.addEventListener("mouseenter", () => {
			isHovering.current = true;
			setShowTooltip(true);
		});

		rangeRef.current?.addEventListener("mouseleave", () => {
			isHovering.current = false;
			if (!isDragging.current) {
				setShowTooltip(false);
			}
		});

		document.addEventListener(
			"mousemove",
			(e) => {
				if (!isDragging.current) return;
				updateRange(e.clientX);
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"mouseup",
			() => {
				if (!isHovering.current) {
					setShowTooltip(false);
				}
				isDragging.current = false;
			},
			{ signal: controller.signal },
		);

		document.addEventListener(
			"mouseleave",
			() => {
				isDragging.current = false;
				setShowTooltip(false);
			},
			{ signal: controller.signal },
		);

		return () => {
			controller.abort?.();
		};
	}, []);

	function updateRange(x: number) {
		if (!rangeTrackRef.current) {
			return;
		}

		const rangeRect = rangeTrackRef.current.getBoundingClientRect();
		let position = x - rangeRect.left;

		if (position < 0) {
			position = 0;
		} else if (position > rangeRect.width) {
			position = rangeRect.width;
		}

		const percentage = (position / rangeRect.width) * (props.maxValue ?? 100);
		setPercentage(Math.round(percentage));
	}

	return (
		<div className={clsx("w-full", props.className)} draggable={false}>
			<div className="relative flex h-8 cursor-pointer items-center" ref={rangeRef}>
				<div className={clsx("absolute h-2 w-full overflow-hidden rounded-md bg-secondary px-1", props.backgroundClassName)}>
					<div className={clsx("absolute left-0 h-full w-2 bg-accent", props.fillClassName)} />
					<div className={clsx("relative top-0 left-0 h-full w-full bg-secondary", props.backgroundClassName)} ref={rangeTrackRef}>
						<div
							className={clsx("h-full bg-accent", props.fillClassName)}
							style={{ width: `${percentage / ((props.maxValue ?? 100) / 100)}%` }}
						/>
					</div>
					{props.children}
				</div>
				<div className="relative mx-1 h-full w-full">
					<Tooltip open={showTooltip}>
						<Tooltip.Trigger
							className="-translate-x-1/2 -translate-y-1/2 absolute top-1/2 h-5 w-5 cursor-w-resize rounded-full bg-white"
							style={{ left: `${percentage / ((props.maxValue ?? 100) / 100)}%` }}
						/>
						<Tooltip.Content>{props.getTooltipText ? props.getTooltipText(percentage) : `${percentage}%`}</Tooltip.Content>
					</Tooltip>
				</div>
			</div>
		</div>
	);
}
