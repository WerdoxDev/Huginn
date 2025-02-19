import { useHuginnWindow } from "@stores/windowStore";
import { open } from "@tauri-apps/plugin-shell";

export function useOpen() {
	const huginnWindow = useHuginnWindow();

	function openUrl(url: string) {
		if (huginnWindow.environment === "desktop") {
			open(url);
		} else {
			window.open(url);
		}
	}

	return { openUrl };
}
