import { useEffect, useState } from "react";

export function useProgressBar(options: { startOffset?: number; endOffset?: number; mouseOffset?: number; defaultValue?: number }) {
	const [percentage, setPercentage] = useState(0);
	const [bufferPercentage, setBufferPercentage] = useState(0);
	const [dragging, setDragging] = useState(false);

	useEffect(() => {
		setPercentage(options.defaultValue ?? options.startOffset ?? 0);
	}, []);

	function getVisualPercentage(percentage: number) {
		let passedPercentage = percentage;
		passedPercentage = Math.max(0, Math.min(100, passedPercentage));

		const startOffset = options.startOffset ?? 0;
		const endOffset = options.endOffset ?? 0;
		const visualPercentage = (passedPercentage / 100) * (100 - startOffset - endOffset) + startOffset;
		const clampedVisualPercentage = Math.max(startOffset, Math.min(100 - endOffset, visualPercentage));
		return clampedVisualPercentage;
	}

	return {
		getVisualPercentage,
		percentage,
		setPercentage,
		startOffset: options.startOffset,
		endOffset: options.endOffset,
		bufferPercentage,
		setBufferPercentage,
		mouseOffset: options.mouseOffset,
		dragging,
		setDragging,
	};
}
