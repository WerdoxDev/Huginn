import { useClient } from "@contexts/apiContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult, HuginnErrorData } from "@huginn/shared";

export function usePatchUser(
   onSuccess?: (result: APIPatchCurrentUserResult) => void,
   handleErrors?: (errors: HuginnErrorData) => void,
) {
   const client = useClient();

   const mutation = useHuginnMutation(
      {
         async mutationFn(data: APIPatchCurrentUserJSONBody) {
            return await client.users.edit(data);
         },
         onSuccess(result) {
            onSuccess?.(result);
         },
      },
      handleErrors,
   );

   return mutation;
}
