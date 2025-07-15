import HuginnButton from "@components/button/HuginnButton";
import HuginnIcon from "@components/HuginnIcon";
import LoadingIcon from "@components/LoadingIcon";
import StartWrapper from "@components/StartWrapper";
import { useStartBackground } from "@contexts/authBackgroundContext";
import { useTryLogin } from "@hooks/useTryLogin";
import { useUpdater } from "@hooks/useUpdater";
import { initializeClient, setHostnamesFromExternal, setHostnamesFromSettings, useClient, useClientStore } from "@stores/clientStore";
import { useSettings } from "@stores/settingsStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useMemo, useReducer } from "react";
import { useNavigate, useSearchParams } from "react-router";

type Step = "none" | "fetch_hostnames" | "check_update" | "connect" | "update" | "login" | "welcome";

type State = {
	current: Step;
	status: "none" | "in-progress" | "error";
	text: string;
	error?: string;
};

type Action = { type: "SET"; step: Step; text: string } | { type: "FAIL"; error: string };

function reducer(state: State, action: Action): State {
	switch (action.type) {
		case "SET":
			return {
				current: action.step,
				text: action.text,
				status: "in-progress",
			};
		case "FAIL":
			return { ...state, status: "error", error: action.error };
		default:
			return state;
	}
}

export default function Index() {
	const huginnWindow = useHuginnWindow();
	const clientStore = useClientStore();
	const client = useClient();
	const settings = useSettings();
	const [search] = useSearchParams();
	const startBackground = useStartBackground();
	const navigate = useNavigate();
	const tryLogin = useTryLogin();

	const { checkAndDownload, updateInfo, progress, contentLength, downloaded } = useUpdater({
		async onNotAvailable() {
			setConnect();
		},
		onError() {
			dispatch({ type: "FAIL", error: "Could not check for updates" });
		},
		onUpdating() {
			dispatch({ type: "SET", step: "update", text: "Updating to" });
		},
	});

	const [state, dispatch] = useReducer(reducer, { current: "none", status: "none", error: "TESS", text: "" });

	const updateProgressText = useMemo(() => {
		return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
	}, [progress]);

	async function continueToLogin() {
		await tryLogin({
			async onError() {
				await navigate({ pathname: "/login", search: `?${search.toString()}` }, { viewTransition: true });
			},
			onFound() {
				startBackground.setState(1);
				dispatch({ type: "SET", step: "login", text: "Logging in..." });
			},
			async onNotFound() {
				await navigate({ pathname: "/login", search: `?${search.toString()}` }, { viewTransition: true });
			},
			async onSuccessful() {
				dispatch({ type: "SET", step: "welcome", text: `Welcome ${client?.user?.displayName ?? client?.user?.username}!` });
			},
			navigatePath: { pathname: search.get("redirect") ?? "/channels/@me" },
		});
	}

	function setCheckUpdate() {
		dispatch({ type: "SET", step: "check_update", text: "Checking for updates..." });
	}

	function setFetchHostnames() {
		dispatch({ type: "SET", step: "fetch_hostnames", text: "Fetching external hostnames..." });
	}

	function setConnect() {
		dispatch({ type: "SET", step: "connect", text: "Connecting..." });
	}

	function retry() {
		if (state.current === "fetch_hostnames") {
			setFetchHostnames();
		} else if (state.current === "check_update") {
			setCheckUpdate();
		}
	}

	useEffect(() => {
		async function decideState() {
			switch (state.current) {
				case "none": {
					if (settings.hostnameSource === "external") {
						setFetchHostnames();
					} else {
						setCheckUpdate();
					}
					break;
				}
				case "fetch_hostnames": {
					const result = await setHostnamesFromExternal();
					if (!result) {
						dispatch({ type: "FAIL", error: "Failed to fetch external hostnames!" });
					} else {
						initializeClient();

						if (huginnWindow.environment !== "desktop") {
							setConnect();
						} else {
							setCheckUpdate();
						}
					}
					break;
				}
				case "check_update": {
					if (!client) {
						setHostnamesFromSettings();
						initializeClient();
					}
					await checkAndDownload();
					break;
				}
			}
		}

		decideState();
	}, [state.current]);

	useEffect(() => {
		startBackground.setState(0);

		if (!huginnWindow.args.includes("--silent")) {
			window.electronAPI.showMain();
		}
	}, []);

	useEffect(() => {
		let unlisten: () => void;
		if (clientStore.isInitialized) {
			unlisten = client.gateway.listen("status_changed", async (status) => {
				if (status === "connected") {
					await continueToLogin();
				}
			});
		}

		return () => {
			unlisten?.();
		};
	}, [clientStore.isInitialized]);

	return (
		<StartWrapper transitionName="start-index" className="!w-auto !bg-transparent !p-0 !shadow-none">
			<div className="flex w-full select-none flex-col items-center">
				{state.status === "error" ? (
					<div className="rounded-full bg-negative-600 p-3">
						<div className="rounded-full bg-negative-200 p-3">
							<IconMingcuteAlertLine className="h-8 w-8 text-white" />
						</div>
					</div>
				) : (
					<HuginnIcon
						outlined
						className={clsx(
							"hover:-rotate-12 size-20 animate-pulse text-primary-500 drop-shadow-[0px_0px_25px_rgb(var(--color-primary-700))] transition-all hover:scale-105 active:rotate-6",
						)}
					/>
				)}
				<div className="mt-4 font-bold text-text text-xl">{state.status === "error" ? "Something went wrong" : "Huginn"}</div>
				<div className="mt-2 text-text/80">
					<div className="flex items-center justify-center gap-x-2 text-center">
						<span className="text-lg">
							{state.error ?? state.text}
							<span className="font-bold ">{state.current === "update" ? updateInfo?.version : ""}</span>
						</span>
						{/* {state.status === "error" && <IconMingcuteAlertFill className="size-6 text-negative-100" />} */}
						{(state.current === "check_update" ||
							state.current === "update" ||
							state.current === "connect" ||
							state.current === "fetch_hostnames") &&
							state.status !== "error" &&
							progress === 0 && <LoadingIcon className="size-6" />}
					</div>
				</div>
				{state.status === "error" && (
					<div className="no-drag-region bottom-3 mt-4 flex w-full justify-center gap-x-2 ">
						<HuginnButton type="button" className="w-32 rounded-md py-1" color="primary" onClick={retry}>
							Retry
						</HuginnButton>
						{state.current === "check_update" && (
							<HuginnButton color="surface-deep" type="button" className="w-32 rounded-md py-1" onClick={continueToLogin}>
								Continue
							</HuginnButton>
						)}
					</div>
				)}
				{state.current === "update" && progress !== 0 && (
					<div className="relative mt-3 h-6 w-56 rounded-md bg-surface-deep">
						<div className="h-full rounded-md bg-primary-500" style={{ width: `${progress}%` }} />
						<div className="absolute right-0 left-0 flex items-center justify-center">
							<div className="rounded-b-md bg-surface-alt px-2 py-1 text-text/50 text-xs">{updateProgressText}</div>
						</div>
					</div>
				)}
			</div>
		</StartWrapper>
	);
}
