import ModalCloseButton from "@components/button/ModalCloseButton";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { DialogPanel } from "@headlessui/react";

export default function NewsModal() {
	const { news: modal } = useModals();
	const dispatch = useModalsDispatch();

	return (
		<DialogPanel
			transition
			className="relative rounded-xl border-2 border-primary/50 bg-background p-3 transition-[opacity_transform] duration-200 data-[closed]:scale-90"
		>
			<div className="flex flex-col">
				<div className="font-bold text-text text-xl">News</div>
				<div className="text-text/80">19th December 2025</div>
			</div>
			<ModalCloseButton onClick={() => dispatch({ news: { isOpen: false } })} />
		</DialogPanel>
	);
}
