import { HTTPError, HuginnAPIError } from "@huginn/shared";
import { ErrorMessages } from "@lib/error-messages";
import { useModals } from "@stores/modalsStore";

export function useErrorHandler(action?: ReturnType<typeof useModals>["info"]["action"]) {
   const { updateModals } = useModals();

   function handleError(error: unknown) {
      if (error instanceof HuginnAPIError) {
         updateModals({
            info: { isOpen: true, title: "Error", text: error.message, status: "error", action: action },
         });
      } else if (error instanceof HTTPError) {
         if (error.status === 500) {
            updateModals({
               info: { isOpen: true, ...ErrorMessages.serverError(), status: "error", action: action },
            });
         }
      } else if (error instanceof TypeError) {
         if (error.message.toLowerCase() === "failed to fetch") {
            updateModals({
               info: {
                  isOpen: true,
                  ...ErrorMessages.connectionLostError(),
                  status: "error",
                  action: action,
               },
            });
         } else {
            updateModals({
               info: { isOpen: true, ...ErrorMessages.appError(), status: "error", action: action },
            });
         }
      } else if (error instanceof Error) {
         updateModals({
            info: { isOpen: true, ...ErrorMessages.appError(), status: "error", action: action },
         });
      }
   }

   return handleError;
}
