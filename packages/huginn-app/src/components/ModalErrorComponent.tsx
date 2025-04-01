import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { useModals } from "@stores/modalsStore";
import { useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

export default function ModalErrorComponent(props: { error: unknown }) {
	const { resetBoundary } = useErrorBoundary();
	const { updateModals } = useModals();
	const handleError = useErrorHandler({
		cancel: {
			callback: () => {
				updateModals({
					info: { isOpen: false },
					addRecipient: { isOpen: false },
					settings: { isOpen: false },
					createDM: { isOpen: false },
					editGroup: { isOpen: false },
					imageCrop: { isOpen: false },
				});
				resetBoundary();
			},
		},
	});

	useEffect(() => {
		handleError(props.error);
	}, []);

	return null;
}
