import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import { type ReactNode, Suspense } from "react";

export default function BaseModal(props: { modal: { isOpen: boolean }; onClose: () => void; children?: ReactNode; renderChildren: ReactNode }) {
	const appWindow = useWindow();
	return (
		<Suspense>
			<Dialog
				open={props.modal.isOpen}
				transition
				onClose={props.onClose}
				className="relative z-10 transition duration-200 data-[closed]:opacity-0"
			>
				<ModalBackground />
				<div className={clsx("fixed inset-0", appWindow.environment === "desktop" && "top-6")}>
					<div className="flex h-full w-full items-center justify-center">{props.renderChildren}</div>
				</div>
			</Dialog>
		</Suspense>
	);
}
