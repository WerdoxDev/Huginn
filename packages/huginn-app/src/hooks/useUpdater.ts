import { useSettings } from "@contexts/settingsContext";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useRef, useState } from "react";

type UpdateProgress = {
	downloaded: number;
	contentLength: number;
};

type UpdateInfo = {
	body: string;
	currentVersion: string;
	version: string;
};

export default function useUpdater(onFinished?: (wasAvailable: boolean) => void) {
	const [progress, setProgress] = useState(0);
	const [info, setInfo] = useState<UpdateInfo>();
	const contentLength = useRef(0);
	const downloaded = useRef(0);
	const settings = useSettings();

	useEffect(() => {
		let unlistenProgress: UnlistenFn;
		let unlistenFinished: UnlistenFn;
		let unlistenInfo: UnlistenFn;
		let unlistenNotAvailable: UnlistenFn;

		async function listenToEvents() {
			unlistenNotAvailable = await listen("update-not-available", () => {
				onFinished?.(false);
			});
			unlistenInfo = await listen<UpdateInfo>("update-info", (event) => {
				setInfo(event.payload);
			});
			unlistenProgress = await listen<UpdateProgress>("update-progress", (event) => {
				downloaded.current = event.payload.downloaded;
				contentLength.current = event.payload.contentLength;
				setProgress((downloaded.current / contentLength.current) * 100);
			});
			unlistenFinished = await listen("update-finished", () => {
				console.log("Update finished!");
				onFinished?.(true);
			});
		}

		listenToEvents();

		return () => {
			unlistenProgress?.();
			unlistenFinished?.();
			unlistenInfo?.();
			unlistenNotAvailable?.();
		};
	}, []);

	async function checkAndDownload() {
		await invoke("check_update", { target: `windows-${settings.flavour}` });
	}

	return { checkAndDownload, info, progress, contentLength, downloaded };
}
