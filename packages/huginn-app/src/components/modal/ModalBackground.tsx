import { useWindow } from "@contexts/windowContext.tsx";
import { DialogBackdrop } from "@headlessui/react";
import { clsx } from "@nick/clsx";

export default function ModalBackground() {
	const appWindow = useWindow();

	return (
		<DialogBackdrop
			className={clsx("fixed inset-0 bg-black/50", !appWindow.maximized && "rounded-b-lg", appWindow.environment === "desktop" && "top-6")}
		/>
	);
}
