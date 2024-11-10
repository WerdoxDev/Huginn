import { type WebviewWindow, getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import clsx from "clsx";
import type { ReactPortal } from "react";
import { createPortal } from "react-dom";

export default function TitleBar(): ReactPortal {
	const huginnWindow = useWindow();
	const appWindow = useRef<WebviewWindow>();

	async function minimize() {
		await appWindow.current?.minimize();
	}

	async function maximize() {
		await appWindow.current?.toggleMaximize();
	}

	async function close() {
		await appWindow.current?.close();
	}

	useEffect(() => {
		if (window.__TAURI_INTERNALS__) {
			appWindow.current = getCurrentWebviewWindow();
		}
	}, []);

	return createPortal(
		<div
			className={clsx(
				"fixed top-0 right-0 left-0 flex h-6 shrink-0 select-none items-center overflow-hidden bg-background",
				// huginnWindow.maximized ? "rounded-t-none" : "rounded-t-lg",
			)}
			data-tauri-drag-region
		>
			<div className="pointer-events-none mx-3.5 flex-shrink-0 font-medium text-text text-xs uppercase">Huginn</div>
			<div className="w-full flex-shrink" />
			<div className="flex h-full gap-x-1">
				<button type="button" className="flex h-full w-8 items-center justify-center hover:bg-secondary" onClick={minimize}>
					<IconMingcuteMinimizeFill className="h-4 w-4 text-white opacity-80" />
				</button>
				<button type="button" className="flex h-full w-8 items-center justify-center hover:bg-secondary" onClick={maximize}>
					{huginnWindow.maximized ? (
						<IconMingcuteFullscreenExitFill className="h-4 w-4 text-white opacity-80" />
					) : (
						<IconMingcuteFullscreenFill className="h-4 w-4 text-white opacity-80" />
					)}
				</button>
				<button type="button" className="flex h-full w-8 items-center justify-center hover:bg-error" onClick={close}>
					<IconMingcuteCloseFill className="h-4 w-4 text-white opacity-80" />
				</button>
			</div>
		</div>,
		document.body,
	);
}
