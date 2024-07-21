import { HTTPError } from "@huginn/api";
import { Messages } from "@lib/errorMessages";
import { useModalsDispatch } from "@contexts/modalContext";

export function useServerErrorHandler() {
   const dispatch = useModalsDispatch();

   function handleServerError(error: unknown) {
      if (error instanceof HTTPError) {
         if (error.status === 500) {
            dispatch({ info: { isOpen: true, text: Messages.serverError(), status: "error", action: undefined } });
         }
      } else if (error instanceof TypeError) {
         if (error.message.toLowerCase() === "failed to fetch") {
            dispatch({ info: { isOpen: true, text: Messages.connectionLostError(), status: "error", action: undefined } });
         } else dispatch({ info: { isOpen: true, text: Messages.appError(), status: "error", action: undefined } });
      } else if (error instanceof Error) {
         dispatch({ info: { isOpen: true, text: Messages.appError(), status: "error", action: undefined } });
      }
   }

   return handleServerError;
}
