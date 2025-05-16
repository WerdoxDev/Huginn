import { useHuginnWindow } from "@stores/windowStore";
import { type RefObject, useEffect, useState } from "react";

export function useFullscreen(element: RefObject<HTMLDivElement | null>) {
	const [isFullscreen, setFullscreen] = useState(false);
	const huginnWindow = useHuginnWindow();

	useEffect(() => {
		if (isFullscreen && !huginnWindow.fullscreen) {
			setFullscreen(false);
			document.exitFullscreen();
		}
	}, [huginnWindow.fullscreen]);

	useEffect(() => {
		const controller = new AbortController();

		document.addEventListener(
			"fullscreenchange",
			() => {
				setFullscreen(document.fullscreenElement !== null);
			},
			{ signal: controller.signal },
		);

		return () => {
			controller.abort();
		};
	}, []);

	async function toggleFullscreen() {
		if (isFullscreen) {
			await document.exitFullscreen();
		} else {
			await element.current?.requestFullscreen();
		}
	}

	return { isFullscreen, toggleFullscreen };
}
