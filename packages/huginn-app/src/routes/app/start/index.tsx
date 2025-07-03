import HuginnIcon from "@components/HuginnIcon";
import LoadingIcon from "@components/LoadingIcon";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { useTryLogin } from "@hooks/useTryLogin";
import { useUpdater } from "@hooks/useUpdater";
import { client, useClient } from "@stores/apiStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

const loadingStates = {
	checking_update: "Checking for updates",
	updating: "Updating to",
	cant_update: "Could not check for updates",
	logging_in: "Logging in...",
	welcome: () => `Welcome ${client.user?.displayName ?? client.user?.username}!`,
	none: "Invalid State",
} as const;

export default function Index() {
	const huginnWindow = useHuginnWindow();
	const [search] = useSearchParams();
	const startBackground = useStartBackground();
	const navigate = useNavigate();
	const tryLogin = useTryLogin();
	const client = useClient();
	const { checkAndDownload, info, progress, contentLength, downloaded } = useUpdater(
		async () => {
			await continueToLogin();
		},
		() => {
			setLoadingState("checking_update");
		},
		() => {
			setLoadingState("cant_update");
		},
	);

	const [loadingState, setLoadingState] = useState<keyof typeof loadingStates>("none");

	const updateProgressText = useMemo(() => {
		return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
	}, [progress]);

	function startUpdate() {
		setLoadingState("checking_update");
	}

	async function continueToLogin() {
		await tryLogin({
			async onError() {
				await navigate({ pathname: "/login", search: `?${search.toString()}` }, { viewTransition: true });
			},
			onFound() {
				startBackground.setState(1);
				setLoadingState("logging_in");
			},
			async onNotFound() {
				await navigate({ pathname: "/login", search: `?${search.toString()}` }, { viewTransition: true });
			},
			async onSuccessful() {
				setLoadingState("welcome");
				// await new Promise((r) => setTimeout(r, 1000));
			},
			navigatePath: { pathname: search.get("redirect") ?? "/channels/@me" },
		});
	}

	async function navigateRedirect() {
		const redirect = search.get("redirect");

		startBackground.setState(1);
		setLoadingState("logging_in");

		if (redirect) {
			await navigate({ pathname: redirect }, { viewTransition: true });
		}
	}

	useEffect(() => {
		if (loadingState === "checking_update") {
			checkAndDownload();
		}
	}, [loadingState]);

	useEffect(() => {
		if (info) {
			setLoadingState("updating");
		}
	}, [info]);

	useEffect(() => {
		startBackground.setState(0);

		if (search.get("redirect") && client.gateway.status === "authenticated") {
			navigateRedirect();
			return;
		}

		if (huginnWindow.environment !== "desktop") {
			continueToLogin();
			return;
		}

		if (!huginnWindow.args.includes("--silent")) {
			window.electronAPI.showMain();
		}

		startUpdate();
	}, []);

	return (
		<StartWrapper shownId="" transitionName="start-index" className="bg-transparent! shadow-none! w-auto! p-0!">
			<div className="flex w-full select-none flex-col items-center">
				<HuginnIcon
					outlined
					className="hover:-rotate-12 size-20 animate-pulse text-accent drop-shadow-[0px_0px_25px_rgb(var(--color-primary))] transition-all hover:scale-105 active:rotate-6"
				/>
				<div className="mt-4 font-bold text-text text-xl">Huginn</div>
				<div className="mt-2 text-text/80">
					<div className="flex items-center justify-center gap-x-2 text-center">
						<span className="text-lg">
							{typeof loadingStates[loadingState] === "string" ? loadingStates[loadingState] : loadingStates[loadingState]()}{" "}
							<span className="font-bold ">{loadingState === "updating" ? info?.version : ""}</span>
						</span>
						{loadingState === "cant_update" && <IconMingcuteAlertFill className="size-6 text-error" />}
						{(loadingState === "checking_update" || (loadingState === "updating" && progress === 0)) && <LoadingIcon className="size-6" />}
					</div>
				</div>
				{loadingState === "cant_update" && (
					<div className="no-drag-region bottom-3 mt-4 flex w-full justify-between gap-x-2 ">
						<button type="button" className="w-full rounded-md bg-primary py-1 text-white hover:bg-primary" onClick={startUpdate}>
							Retry
						</button>
						<button type="button" className="w-full rounded-md bg-tertiary py-1 text-white hover:bg-tertiary" onClick={continueToLogin}>
							Continue
						</button>
					</div>
				)}
				{loadingState === "updating" && progress !== 0 && (
					<div className="relative mt-3 h-6 w-56 rounded-md bg-secondary">
						<div className="h-full rounded-md bg-accent" style={{ width: `${progress}%` }} />
						<div className="absolute right-0 left-0 flex items-center justify-center">
							<div className="rounded-b-md bg-secondary px-2 py-1 text-text/50 text-xs">{updateProgressText}</div>
						</div>
					</div>
				)}
			</div>
		</StartWrapper>
	);
}
