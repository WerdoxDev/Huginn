import { editSettingsOptions } from "@lib/queries";
import { useMutation } from "@tanstack/react-query";

export function useEditSettings() {
   const mutation = useMutation(editSettingsOptions);

   return mutation;
}
