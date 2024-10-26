import { Description, DialogPanel, DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";

export default function InfoModal() {
	const { info: modal } = useModals();
	const dispatch = useModalsDispatch();
	const posthog = usePostHog();

	const backgroundColor = useMemo(
		() => (modal.status === "default" ? "bg-warning" : modal.status === "error" ? "bg-error" : modal.status === "success" ? "bg-primary" : ""),
		[modal],
	);

	const borderColor = useMemo(
		() =>
			modal.status === "default"
				? "border-warning/50"
				: modal.status === "error"
					? "border-error/50"
					: modal.status === "success"
						? "border-success/50"
						: "border-primary/50",
		[modal],
	);

	const errorCode = useMemo(() => modal.text.match(/\([A-Za-z0-9]+\)/g)?.[0] ?? "", [modal.text]);

	const formattedText = useMemo(() => {
		return modal.text.replace(/\([A-Za-z0-9]+\)/g, "");
	}, [modal.text]);

	useEffect(() => {
		if (modal.isOpen) {
			posthog.capture("info_modal_opened", { title: modal.title, text: modal.text, status: modal.status });
		} else {
			posthog.capture("info_modal_closed");
		}
	}, [modal.isOpen]);

	return (
		<BaseModal
			modal={modal}
			onClose={() => (!modal.action?.cancel ? modal.closable && dispatch({ info: { isOpen: false } }) : modal.action.cancel.callback())}
		>
			<DialogPanel
				className={clsx(
					"w-full max-w-xs transform overflow-hidden rounded-xl border-2 bg-background p-5 transition-[opacity_transform] data-[closed]:scale-95",
					borderColor,
				)}
			>
				<DialogTitle as="div" className="flex w-full flex-col items-center justify-center gap-y-5">
					<div className={clsx("rounded-full bg-opacity-20 p-3", backgroundColor)}>
						<div className={clsx("rounded-full bg-opacity-80 p-3", backgroundColor)}>
							{modal.status === "error" && <IconMingcuteAlertLine className="h-8 w-8 text-white" />}
							{modal.status === "default" && <IconMingcuteInformationLine className="h-8 w-8 text-white" />}
						</div>
					</div>
					<div className="font-medium text-lg text-white">{modal.title}</div>
				</DialogTitle>
				<Description className="mt-1 flex items-center justify-center" as="div">
					<div className="text-center text-text/90">
						{formattedText}
						{errorCode && <span className="text-nowrap text-error italic opacity-90">{errorCode}</span>}
					</div>
				</Description>

				<div className="mt-5 flex items-center justify-end gap-x-2">
					<HuginnButton
						className="!rounded-lg w-full bg-secondary py-2.5"
						onClick={() => {
							if (!modal.action?.cancel?.callback) dispatch({ info: { isOpen: false } });
							else modal.action.cancel.callback();
						}}
					>
						{modal.action?.cancel?.text ?? "Close"}
					</HuginnButton>

					{modal.action?.confirm && (
						<HuginnButton
							className="!rounded-lg w-full bg-primary py-2.5 text-text"
							onClick={() => {
								modal.action?.confirm?.callback();
							}}
						>
							{modal.action.confirm.text}
						</HuginnButton>
					)}
				</div>

				{modal.closable && (
					<ModalCloseButton
						onClick={() => {
							dispatch({ info: { isOpen: false } });
						}}
					/>
				)}
			</DialogPanel>
		</BaseModal>
	);
}
