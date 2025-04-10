import { useHuginnWindow } from "@stores/windowStore";

export function useOpen() {
	const huginnWindow = useHuginnWindow();

	function openUrl(url: string) {
		if (huginnWindow.environment === "desktop") {
			//TODO: MIGRATION
			open(url);
		} else {
			window.open(url);
		}
	}

	return { openUrl };
}
