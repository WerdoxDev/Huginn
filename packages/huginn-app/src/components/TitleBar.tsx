import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import type { ReactPortal } from "react";
import { createPortal } from "react-dom";
import ConnectionStatus from "./ConnectionStatus";

export default function TitleBar(): ReactPortal {
	const huginnWindow = useHuginnWindow();

	async function minimize() {
		window.electronAPI.minimize();
	}

	async function maximize() {
		window.electronAPI.toggleMaximize();
	}

	async function close() {
		window.electronAPI.hideMain();
	}

	return createPortal(
		<div
			className={clsx(
				"drag-region fixed top-0 right-0 left-0 z-10 flex h-6 shrink-0 select-none items-center overflow-hidden bg-background",
				// huginnWindow.maximized ? "rounded-t-none" : "rounded-t-lg",
			)}
		>
			<div className="pointer-events-none mx-3.5 flex-shrink-0 font-medium text-text text-xs uppercase">Huginn</div>
			<ConnectionStatus />
			<div className="no-drag-region ml-auto flex h-full gap-x-1">
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
