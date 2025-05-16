import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useState } from "react";

export function useFullscreen() {
	const [isFullscreen, setFullscreen] = useState(false);
	const huginnWindow = useHuginnWindow();

	useEffect(() => {
		if (isFullscreen && !huginnWindow.fullscreen) {
			setFullscreen(false);
		}
	}, [huginnWindow.fullscreen]);

	function toggleFullscreen() {
		if (isFullscreen) {
			window.electronAPI.setFullscreen(false);
			setFullscreen(false);
		} else {
			window.electronAPI.setFullscreen(true);
			setFullscreen(true);
		}
	}

	return { isFullscreen, toggleFullscreen };
}
