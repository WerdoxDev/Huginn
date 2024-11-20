import type { LoadingState } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export default function Component() {
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

		invoke("open_splashscreen");
		checkForUpdate();

		return () => {
			bc.close();
		};
	}, []);

	return (
		<div className="flex h-full w-full select-none rounded-xl bg-background" data-tauri-drag-region>
			<div className="mt-16 flex w-full flex-col items-center" data-tauri-drag-region>
				<IconFa6SolidCrow className="hover:-rotate-12 size-20 animate-pulse text-accent drop-shadow-[0px_0px_25px_rgb(var(--color-primary))] transition-all hover:scale-105 active:rotate-6" />
				<div className="mt-3 font-bold text-text text-xl">Huginn</div>
				<div className="mt-3 text-text/80">
					<div className="flex items-center justify-center gap-x-2">
						{loadingText}
						<LoadingIcon className="size-6" />
					</div>
				</div>
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
