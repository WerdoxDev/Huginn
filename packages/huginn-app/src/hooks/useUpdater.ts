import { useHuginnWindow } from "@stores/windowStore";
import { useMutation } from "@tanstack/react-query";
import type { UpdateInfo } from "electron-updater";
import { useEffect, useRef, useState } from "react";

type UpdateProgress = {
	downloaded: number;
	contentLength: number;
};

// type UpdateInfo = {
// 	body: string;
// 	currentVersion: string;
// 	version: string;
// };

export function useUpdater(onNotAvailable?: () => void, onTry?: () => void, onFail?: () => void, onError?: () => void) {
	const huginnWindow = useHuginnWindow();
	const [progress, setProgress] = useState(0);
	const [info, setInfo] = useState<UpdateInfo>();
	const contentLength = useRef(0);
	const downloaded = useRef(0);
	const isChecking = useRef(false);
	const updateMutation = useMutation({
		mutationKey: ["update"],
		async mutationFn() {
			onTry?.();
			const result = await window.electronAPI.checkUpdate();
			if (!result || result.version === huginnWindow.version) {
				onNotAvailable?.();
			} else {
				window.electronAPI.downloadUpdate();
				setInfo(result);
			}
		},
		onError(error, variables, context) {
			console.log(error);
			isChecking.current = false;
			onError?.();
		},
		retry: 2,
		retryDelay: 3000,
	});

	useEffect(() => {
		if (huginnWindow.environment !== "desktop") {
			return;
		}

		const unlisten = window.electronAPI.onUpdateProgress((_, info) => {
			downloaded.current = info.transferred;
			contentLength.current = info.total;
			setProgress(info.percent);
		});

		return () => {
			unlisten();
		};
	}, []);

	async function checkAndDownload() {
		if (!isChecking.current) {
			isChecking.current = true;
			updateMutation.mutate();
		}
	}

	return { checkAndDownload, info, progress, contentLength, downloaded };
}
