import { HTTPError } from "@huginn/shared";
import { Messages } from "@lib/error-messages";
import { useModals } from "@stores/modalsStore";

export function useErrorHandler(action?: ReturnType<typeof useModals>["info"]["action"]) {
	const { updateModals } = useModals();

	function handleError(error: unknown) {
		if (error instanceof HTTPError) {
			if (error.status === 500) {
				updateModals({ info: { isOpen: true, ...Messages.serverError(), status: "error", action: action } });
			}
		} else if (error instanceof TypeError) {
			if (error.message.toLowerCase() === "failed to fetch") {
				updateModals({ info: { isOpen: true, ...Messages.connectionLostError(), status: "error", action: action } });
			} else {
				updateModals({ info: { isOpen: true, ...Messages.appError(), status: "error", action: action } });
			}
		} else if (error instanceof Error) {
			updateModals({ info: { isOpen: true, ...Messages.appError(), status: "error", action: action } });
		}
	}

	return handleError;
}
