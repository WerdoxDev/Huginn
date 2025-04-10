import { useHuginnWindow } from "@stores/windowStore";
import { type ReactNode, createContext, useContext, useEffect } from "react";
import { useNavigate } from "react-router";

type NotificationContextType = {
	sendNotification: (data: string, title: string, text: string, imagePath: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);
// let permissionGranted = false;

export async function initializeNotification() {
	if (!window.__TAURI_INTERNALS__) {
		return;
	}

	//TODO: MIGRATION
	// permissionGranted = await isPermissionGranted();

	// if (!permissionGranted) {
	// 	const permission = await requestPermission();
	// 	permissionGranted = permission === "granted";
	// }
}

let canSend = true;

export function NotificationProvider(props: { children?: ReactNode }) {
	const huginnWindow = useHuginnWindow();
	const navigate = useNavigate();

	useEffect(() => {
		if (huginnWindow.environment !== "desktop") {
			return;
		}

		initializeNotification().then();

		// Listen to click event and navigate user to the channel
		//TODO: MIGRATION
		// const unlisten = listen("notification-clicked", async (event) => {
		// 	const data = event.payload as string;
		// 	await invoke("open_and_focus_main");
		// 	//TODO: THIS SHOULD CHANGE WHEN GUIDS ARE A THING
		// 	await navigate(`/channels/@me/${data}`);
		// });

		// return () => {
		// 	unlisten.then((f) => f());
		// };
	}, []);

	return (
		<NotificationContext.Provider value={{ sendNotification: huginnWindow.environment === "desktop" ? sendNotification : () => {} }}>
			{props.children}
		</NotificationContext.Provider>
	);
}

export function sendNotification(data: string, title: string, text: string, imagePath: string) {
	if (!canSend) {
		return;
	}

	//TODO: MIGRATION
	// invoke("send_notification", { data, title, text, imagePath });
	canSend = false;
	setTimeout(() => {
		canSend = true;
	}, 2000);
}

export function useNotification() {
	return useContext(NotificationContext);
}
