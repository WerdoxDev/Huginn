import { DialogBackdrop } from "@headlessui/react";
import clsx from "clsx";

export default function ModalBackground() {
	const appWindow = useWindow();

	useEffect(() => {
		console.log(appWindow.maximized);
	}, [appWindow.environment]);

	return (
		<DialogBackdrop
			className={clsx("fixed inset-0 bg-black/50", !appWindow.maximized && "rounded-b-lg", appWindow.environment === "desktop" && "top-6")}
		/>
	);
}
