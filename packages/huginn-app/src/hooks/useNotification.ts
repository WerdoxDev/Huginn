import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";

let permissionGranted = false;

export async function initializeNotification() {
	if (!window.__TAURI_INTERNALS__) {
		return;
	}

	permissionGranted = await isPermissionGranted();

	if (!permissionGranted) {
		const permission = await requestPermission();
		permissionGranted = permission === "granted";
	}
}

function sendNotification(title: string, text: string, imagePath: string) {
	invoke("send_notification", { title, text, imagePath });
}

export function useNotification() {
	const huginnWindow = useHuginnWindow();
	return { sendNotification: huginnWindow.environment === "desktop" ? sendNotification : () => {} };
}
