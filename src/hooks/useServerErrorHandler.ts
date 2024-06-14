import { HTTPError } from "@api/errors/http-error";
import { Messages } from "@lib/errorMessages";
import { useModalsDispatch } from "@contexts/modalContext";

export function useServerErrorHandler() {
   const dispatch = useModalsDispatch();

   function handleServerError(error: unknown) {
      if (error instanceof HTTPError) {
         if (error.status === 500) {
            dispatch({ info: { isOpen: true, text: Messages.huginnMalfunctionError(), status: "error" } });
         }
      } else if (error instanceof Error) {
         dispatch({ info: { isOpen: true, text: Messages.frostHoldError(), status: "error" } });
      }
   }

   return handleServerError;
}
