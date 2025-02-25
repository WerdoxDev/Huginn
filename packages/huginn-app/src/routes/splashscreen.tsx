import HuginnIcon from "@components/HuginnIcon";
import LoadingIcon from "@components/LoadingIcon";
import { useCountdown } from "@hooks/useCountdown";
import { useUpdater } from "@hooks/useUpdater";
import { useHuginnWindow } from "@stores/windowStore";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useRef, useState } from "react";

const loadingStates = {
	loading: "Loading",
	checking_update: "Checking for updates",
	updating: "Updating",
	checking_update_failed: "Update failed",
	cant_update: "Could not check for updates",
	none: "Invalid State",
} as const;

export default function Splashscreen() {
	const updateFinished = useRef(false);
	const huginnWindow = useHuginnWindow();
	const { startCountdown, countdown: retryCountdown } = useCountdown();
	const { checkAndDownload, info, progress, contentLength, downloaded } = useUpdater(
		async (wasAvailable) => {
			setLoadingState("loading");
			if (!wasAvailable) {
				if (huginnWindow.matches.args?.silent?.value !== true) {
					switchToMain();
				}
				updateFinished.current = true;
			}
		},
		() => {
			setLoadingState("checking_update");
		},
		() => {
			setLoadingState("checking_update_failed");
			startCountdown(3);
		},
		() => {
			setLoadingState("cant_update");
		},
	);

	const [loadingState, setLoadingState] = useState<keyof typeof loadingStates>("none");

	const updateProgressText = useMemo(() => {
		return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
	}, [downloaded.current, contentLength.current, progress]);

	function startUpdate() {
		setLoadingState("checking_update");
		checkAndDownload();
	}

	function switchToMain() {
		invoke("close_splashscreen");
		invoke("open_and_focus_main");
	}

	useEffect(() => {
		if (info) {
			setLoadingState("updating");
		}
	}, [info]);

	useEffect(() => {
		updateFinished.current = false;

		const bc = new BroadcastChannel("huginn");
		bc.onmessage = (event) => {
			if (event.data.name === "restart_splashscreen") {
				setLoadingState("checking_update");
				checkAndDownload();
			}
		};

		if (huginnWindow.matches.args?.silent?.value !== true) {
			invoke("close_main");
			invoke("open_splashscreen");
		}

		startUpdate();

		const unlisten = listen("tray-clicked", () => {
			if (updateFinished.current) {
				invoke("open_and_focus_main");
			} else {
				invoke("open_splashscreen");
			}
		});

		return () => {
			bc.close();
			unlisten.then((f) => f());
		};
	}, []);

	return (
		<div className="flex h-full w-full select-none rounded-xl bg-background" data-tauri-drag-region>
			<div className="mt-16 flex w-full flex-col items-center" data-tauri-drag-region>
				<HuginnIcon className="hover:-rotate-12 size-20 animate-pulse text-accent drop-shadow-[0px_0px_25px_rgb(var(--color-primary))] transition-all hover:scale-105 active:rotate-6" />
				<div className="mt-4 font-bold text-text text-xl">Huginn</div>
				<div className="mt-2 text-text/80">
					<div className="flex items-center justify-center gap-x-2 text-center">
						<span className="text-lg">{loadingStates[loadingState]}</span>
						{loadingState === "checking_update_failed" && <IconMingcuteAlertFill className="size-6 text-warning" />}
						{loadingState === "cant_update" && <IconMingcuteAlertFill className="size-6 text-error" />}
						{loadingState === "checking_update" && <LoadingIcon className="size-6" />}
					</div>
					{loadingState === "checking_update_failed" && <div className="mt-0 text-text/60">Retrying in {retryCountdown} seconds</div>}
				</div>
				{loadingState === "cant_update" && (
					<div className="absolute bottom-3 mt-4 flex w-full justify-between gap-x-2 px-3">
						<button type="button" className="w-full rounded-md bg-primary/50 py-1 text-white hover:bg-primary" onClick={startUpdate}>
							Retry
						</button>
						<button type="button" className="w-full rounded-md bg-tertiary/50 py-1 text-white hover:bg-tertiary" onClick={switchToMain}>
							Continue
						</button>
					</div>
				)}
				{loadingState === "updating" && (
					<div className="relative mt-3 h-6 w-56 rounded-md bg-secondary">
						<div className="h-full rounded-md bg-accent" style={{ width: `${progress}%` }} />
						<div className="absolute right-0 left-0 flex items-center justify-center">
							<div className="rounded-b-md bg-secondary px-2 py-1 text-text/50 text-xs">{updateProgressText}</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
