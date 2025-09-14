import type { APIPostKnownApplicationJSONBody } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { updateKnownApplications } from "@stores/filesStore";
import { useMutation } from "@tanstack/react-query";

export function useSubmitKnownApplication() {
   const client = useClient();
   const mutation = useMutation({
      mutationKey: ["submit-known-application"],
      async mutationFn(data: APIPostKnownApplicationJSONBody) {
         return await client?.applications.submitKnown(data);
      },
      async onSuccess(data, variables, context) {
         await updateKnownApplications();
      },
   });

   return mutation;
}
