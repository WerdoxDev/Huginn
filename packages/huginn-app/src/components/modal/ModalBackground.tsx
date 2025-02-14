import { DialogBackdrop } from "@headlessui/react";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";

export default function ModalBackground() {
	const huginnWindow = useHuginnWindow();

	return (
		<DialogBackdrop
			className={clsx("fixed inset-0 bg-black/50", !huginnWindow.maximized && "rounded-b-lg", huginnWindow.environment === "desktop" && "top-6")}
		/>
	);
}
