import type { ProgressBarProps } from "@/types";
import { useProgressBar } from "@hooks/useProgressBar";
import { useTimeout } from "@hooks/useTimeout";
import { type MouseEvent, useRef, useState } from "react";
import ProgressBar from "./ProgressBar";

export default function VolumeBar(props: Omit<ProgressBarProps, "orientation">) {
	const [audioHovering, setAudioHovering] = useState(false);
	const [muted, setMuted] = useState(false);
	const oldVolume = useRef(0);
	const { cancel: cancelTimeout, start: startTimeout } = useTimeout(() => setAudioHovering(false), 1000);

	function cancelAudioHoverTimeout() {
		cancelTimeout();
		setAudioHovering(true);
	}

	function startAudioHoverTimeout(e: MouseEvent) {
		e.stopPropagation();
		startTimeout();
	}

	function toggleMute() {
		console.log("toggle");
		if (muted) {
			setMuted(false);
			props.setPercentage(oldVolume.current);
			props.onPercentageChange?.(oldVolume.current);
		} else {
			setMuted(true);
			props.setPercentage(props.startOffset ?? 0);
			props.onPercentageChange?.(0);
			oldVolume.current = props.percentage;
		}
	}

	function onPercentageChange(percentage: number) {
		console.log(percentage, muted);
		props.onPercentageChange?.(percentage);
		if (percentage !== 0 && muted) {
			setMuted(false);
		} else if (percentage === 0 && !muted) {
			setMuted(true);
		}
	}

	return (
		<div className="relative flex items-center justify-center">
			<button
				type="button"
				className="shrink-0 cursor-pointer text-white/80 transition-transform hover:text-white active:scale-90"
				onMouseLeave={startAudioHoverTimeout}
				onMouseEnter={cancelAudioHoverTimeout}
				onClick={toggleMute}
			>
				{muted ? <IconMingcuteVolumeMuteFill className="size-6" /> : <IconMingcuteVolumeFill className="size-6" />}
			</button>
			{(audioHovering || props.dragging) && (
				<div
					className="absolute bottom-10 h-24 w-4 rounded-lg bg-tertiary/90 p-1"
					onMouseEnter={cancelAudioHoverTimeout}
					onMouseLeave={startAudioHoverTimeout}
				>
					<ProgressBar {...props} orientation="vertical" onPercentageChange={onPercentageChange} />
				</div>
			)}
		</div>
	);
}
