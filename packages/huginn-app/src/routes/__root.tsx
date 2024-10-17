import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import "@tauri-apps/api";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { PostHog } from "posthog-js";
import { ErrorBoundary } from "react-error-boundary";

export type HuginnRouterContext = {
	queryClient: QueryClient;
	client: ReturnType<typeof useClient>;
	posthog: PostHog;
};

export const Route = createRootRouteWithContext<HuginnRouterContext>()({
	beforeLoad({ context: { client, posthog } }) {
		setup(client, posthog);
	},
	component: Root,
});

function Root() {
	const router = useRouter();

	const appWindow = useWindow();

	useEffect(() => {
		router.subscribe("onBeforeLoad", (arg) => {
			routeHistory.lastPathname = arg.fromLocation.pathname;
		});

		document.addEventListener("contextmenu", (e) => {
			e.preventDefault();
		});
	}, []);

	return (
		// <HistoryContext.Provider value={{ lastPathname: null }}>
		<ThemeProvier>
			<ModalProvider>
				<ContextMenuProvider>
					<UserProvider>
						<PresenceProvider>
							<div className={`flex h-full flex-col overflow-hidden ${appWindow.maximized ? "rounded-none" : "rounded-lg"}`}>
								{router.state.location.pathname !== "/splashscreen" && appWindow.environment === "desktop" && <TitleBar />}
								<div className="relative h-full w-full">
									<Outlet />
									{/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
									{/* <TanStackRouterDevtools position="bottom-left" /> */}
									{appWindow.environment === "desktop" && <AppMaximizedEvent />}
									<ModalsRenderer />
								</div>
							</div>
						</PresenceProvider>
					</UserProvider>
				</ContextMenuProvider>
			</ModalProvider>
		</ThemeProvier>
		// </HistoryContext.Provider>
	);
}

function ModalsRenderer() {
	const { user } = useUser();

	return (
		<>
			<ErrorBoundary FallbackComponent={ModalErrorComponent}>
				<SettingsModal />
				{user && (
					<>
						<CreateDMModal />
						<EditGroupModal />
						<ImageCropModal />
						<AddRecipientModal />
						<ChannelRecipientContextMenu />
						<ChannelsContextMenu />
						<RelationshipMoreContextMenu />
						<RelationshipContextMenu />
					</>
				)}
			</ErrorBoundary>
			<InfoModal />
		</>
	);
}

function AppMaximizedEvent() {
	const dispatch = useWindowDispatch();
	const unlistenFunction = useRef<UnlistenFn>();

	useEffect(() => {
		async function listenToAppResize() {
			const appWindow = getCurrentWebviewWindow();
			const unlisten = await appWindow.onResized(async () => {
				const appMaximized = await appWindow.isMaximized();
				dispatch({ maximized: appMaximized });
			});

			unlistenFunction.current = unlisten;
		}

		if (window.__TAURI_INTERNALS__) {
			listenToAppResize();
		}

		return () => {
			unlistenFunction.current?.();
		};
	}, []);

	return null;
}
