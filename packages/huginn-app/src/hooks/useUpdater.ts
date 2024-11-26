import type { VersionFlavour } from "@/types";
import { invoke } from "@tauri-apps/api/core";
import { type UnlistenFn, listen } from "@tauri-apps/api/event";

type UpdateProgress = {
	downloaded: number;
	contentLength: number;
};

type UpdateInfo = {
	body: string;
	currentVersion: string;
	version: string;
};

export function useUpdater(onFinished?: (wasAvailable: boolean) => void) {
	const [progress, setProgress] = useState(0);
	const [info, setInfo] = useState<UpdateInfo>();
	const contentLength = useRef(0);
	const downloaded = useRef(0);
	const appWindow = useWindow();

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
	}, [appWindow.versionFlavour]);

	async function checkAndDownload(overrideTarget?: VersionFlavour) {
		if (import.meta.env.DEV) {
			onFinished?.(false);
			return;
		}
		// console.log(appWindow.versionFlavour);

		await invoke("check_update", { target: `windows-${overrideTarget ?? appWindow.versionFlavour}` });
	}

	return { checkAndDownload, info, progress, contentLength, downloaded };
}
