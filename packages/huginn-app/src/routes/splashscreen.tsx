import type { LoadingState } from "@/types.ts";
import { useWindowDispatch } from "@contexts/windowContext.tsx";
import useUpdater from "@hooks/useUpdater.ts";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/splashscreen")({
	component: Splashscreen,
});

function Splashscreen() {
	const { checkAndDownload, info, progress, contentLength, downloaded } = useUpdater(async (wasAvailable) => {
		setLoadingState("loading");
		if (!wasAvailable) {
			await invoke("close_splashscreen");
		}
	});

	const appWindowDispatch = useWindowDispatch();

	const [loadingState, setLoadingState] = useState<LoadingState>("none");

	const loadingText = useMemo(() => {
		return loadingState === "loading"
			? "Loading"
			: loadingState === "test"
				? "Test state takes 5 seconds"
				: loadingState === "checking_update"
					? "Checking for updates"
					: loadingState === "updating"
						? `Updating to v${info?.version}`
						: "Invalid State";
	}, [info, loadingState]);

	const updateProgressText = useMemo(() => {
		return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
	}, [downloaded.current, contentLength.current, progress]);

	useEffect(() => {
		if (info) {
			setLoadingState("updating");
		}
	}, [info]);

	useEffect(() => {
		const bc = new BroadcastChannel("huginn");
		bc.onmessage = (event) => {
			if (event.data.name === "restart_splashscreen" && event.data.target) {
				appWindowDispatch({ versionFlavour: event.data.target });

				setLoadingState("checking_update");
				checkAndDownload(event.data.target);
			}
		};

		async function checkForUpdate() {
			setLoadingState("checking_update");
			await checkAndDownload();
		}

		checkForUpdate();

		return () => {
			bc.close();
		};
	}, []);

	return (
		<div className="flex h-full w-full select-none items-center justify-center rounded-xl bg-background" data-tauri-drag-region>
			<div className="flex w-full flex-col items-center" data-tauri-drag-region>
				<IconFa6SolidCrow className="hover:-rotate-12 mb-2.5 size-20 text-accent transition-all active:rotate-6" />
				<div className="mb-5 font-bold text-text text-xl">Huginn</div>
				<div className="mb-2.5 text-text opacity-60">
					<span>{loadingText}</span>
					<span className="loader__dot">.</span>
					<span className="loader__dot">.</span>
					<span className="loader__dot">.</span>
				</div>
				{loadingState === "updating" && (
					<>
						<div className="h-4 w-2/3 overflow-hidden rounded-md bg-secondary">
							<div className="h-full bg-primary" style={{ width: `${progress}%` }} />
						</div>
						<div className="mt-1 text-text text-xs opacity-60">{updateProgressText}</div>
					</>
				)}
			</div>
		</div>
	);
}
