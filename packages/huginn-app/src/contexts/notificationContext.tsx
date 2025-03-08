import { useHuginnWindow } from "@stores/windowStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { type ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router";

type NotificationContextType = {
	sendNotification: (data: string, title: string, text: string, imagePath: string) => void;
};

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType);
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

export function NotificationProvider(props: { children?: ReactNode }) {
	const huginnWindow = useHuginnWindow();
	const navigate = useNavigate();
	const canSend = useRef(true);

	useEffect(() => {
		if (huginnWindow.environment !== "desktop") {
			return;
		}

		initializeNotification().then();

		// Listen to click event and navigate user to the channel
		const unlisten = listen("notification-clicked", async (event) => {
			const data = event.payload as string;
			await invoke("open_and_focus_main");
			//TODO: THIS SHOULD CHANGE WHEN GUIDS ARE A THING
			await navigate(`/channels/@me/${data}`);
		});

		return () => {
			unlisten.then((f) => f());
		};
	}, []);

	function sendNotification(data: string, title: string, text: string, imagePath: string) {
		if (!canSend.current) {
			return;
		}

		invoke("send_notification", { data, title, text, imagePath });
		canSend.current = false;
		setTimeout(() => {
			canSend.current = true;
		}, 2000);
	}

	return (
		<NotificationContext.Provider value={{ sendNotification: huginnWindow.environment === "desktop" ? sendNotification : () => {} }}>
			{props.children}
		</NotificationContext.Provider>
	);
}

export function useNotification() {
	return useContext(NotificationContext);
}
