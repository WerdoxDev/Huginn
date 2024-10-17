import { Dialog, TransitionChild } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode } from "react";

export default function BaseModal(props: { modal: { isOpen: boolean }; onClose: () => void; children?: ReactNode }) {
	const appWindow = useWindow();
	return (
		<Dialog open={props.modal.isOpen} transition onClose={props.onClose} className="relative z-10 transition data-[closed]:opacity-0">
			<ModalBackground />
			<div className={clsx("fixed inset-0", appWindow.environment === "desktop" && "top-6")}>
				<div className="flex h-full items-center justify-center">
					<TransitionChild>{props.children}</TransitionChild>
				</div>
			</div>
		</Dialog>
	);
}
