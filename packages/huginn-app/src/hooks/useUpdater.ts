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

	useEffect(() => {
		const unlistenNotAvailable = listen("update-not-available", () => {
			onFinished?.(false);
		});

		const unlistenInfo = listen<UpdateInfo>("update-info", (event) => {
			setInfo(event.payload);
		});

		const unlistenProgress = listen<UpdateProgress>("update-progress", (event) => {
			downloaded.current = event.payload.downloaded;
			contentLength.current = event.payload.contentLength;
			setProgress((downloaded.current / contentLength.current) * 100);
		});

		const unlistenFinished = listen("update-finished", () => {
			console.log("Update finished!");
			onFinished?.(true);
		});

		const unlistenFailed = listen("update-failed", () => {
			setTimeout(() => {
				invoke("check_update", { target: "windows" });
			}, 2000);
		});

		return () => {
			unlistenProgress.then((f) => f());
			unlistenFinished.then((f) => f());
			unlistenInfo.then((f) => f());
			unlistenNotAvailable.then((f) => f());
			unlistenFailed.then((f) => f());
		};
	}, []);

	async function checkAndDownload() {
		if (import.meta.env.DEV) {
			// onFinished?.(false);
			// return;
		}

		await invoke("check_update", { target: "windows" });
	}

	return { checkAndDownload, info, progress, contentLength, downloaded };
}
