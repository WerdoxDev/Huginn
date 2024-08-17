import { HTTPError } from "@huginn/shared";
import { Messages } from "@lib/error-messages";
import { ModalContextType, useModalsDispatch } from "@contexts/modalContext";
import { useErrorBoundary } from "react-error-boundary";

export function useErrorHandler(action?: ModalContextType["info"]["action"]) {
   const dispatch = useModalsDispatch();

   function handleError(error: unknown) {
      if (error instanceof HTTPError) {
         if (error.status === 500) {
            dispatch({ info: { isOpen: true, ...Messages.serverError(), status: "error", action: action } });
         }
      } else if (error instanceof TypeError) {
         if (error.message.toLowerCase() === "failed to fetch") {
            dispatch({ info: { isOpen: true, ...Messages.connectionLostError(), status: "error", action: action } });
         } else {
            dispatch({ info: { isOpen: true, ...Messages.appError(), status: "error", action: action } });
         }
      } else if (error instanceof Error) {
         dispatch({ info: { isOpen: true, ...Messages.appError(), status: "error", action: action } });
      }
   }

   return handleError;
}
