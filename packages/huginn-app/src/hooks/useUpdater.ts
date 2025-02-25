import { useMutation } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
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

export function useUpdater(onFinished?: (wasAvailable: boolean) => void, onTry?: () => void, onFail?: () => void, onError?: () => void) {
	const [progress, setProgress] = useState(0);
	const [info, setInfo] = useState<UpdateInfo>();
	const contentLength = useRef(0);
	const downloaded = useRef(0);
	const isChecking = useRef(false);
	const updateMutation = useMutation({
		mutationKey: ["update"],
		async mutationFn() {
			onTry?.();
			const result = await new Promise<UpdateInfo | undefined>((res, rej) => {
				const unlistenInfo = listen<UpdateInfo>("update-info", (event) => {
					unlistenAll();
					res(event.payload);
				});
				const unlistenNotAvailable = listen("update-not-available", () => {
					unlistenAll();
					onFinished?.(false);
					res(undefined);
				});
				const unlistenFailed = listen("update-failed", () => {
					unlistenAll();
					onFail?.();
					rej();
				});

				function unlistenAll() {
					unlistenInfo.then((f) => f());
					unlistenFailed.then((f) => f());
					unlistenNotAvailable.then((f) => f());
				}

				invoke("check_update", { target: "windows" });
			});

			setInfo(result);
		},
		onError(error, variables, context) {
			isChecking.current = false;
			onError?.();
		},
		retry: 2,
		retryDelay: 3000,
	});

	useEffect(() => {
		const unlistenProgress = listen<UpdateProgress>("update-progress", (event) => {
			downloaded.current = event.payload.downloaded;
			contentLength.current = event.payload.contentLength;
			setProgress((downloaded.current / contentLength.current) * 100);
		});

		const unlistenFinished = listen("update-finished", () => {
			console.log("Update finished!");
			onFinished?.(true);
		});

		return () => {
			unlistenProgress.then((f) => f());
			unlistenFinished.then((f) => f());
		};
	}, []);

	async function checkAndDownload() {
		if (import.meta.env.DEV) {
			onFinished?.(false);
			return;
		}

		if (!isChecking.current) {
			isChecking.current = true;
			updateMutation.mutate();
		}
	}

	return { checkAndDownload, info, progress, contentLength, downloaded };
}
