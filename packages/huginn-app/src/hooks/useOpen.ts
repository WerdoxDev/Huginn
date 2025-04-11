import { useHuginnWindow } from "@stores/windowStore";

export function useOpen() {
	const huginnWindow = useHuginnWindow();

	function openUrl(url: string) {
		if (huginnWindow.environment === "desktop") {
			window.electronAPI.openExteral(url);
		} else {
			window.open(url);
		}
	}

	return { openUrl };
}
