import { useClient } from "@contexts/apiContext";
import { useEvent } from "@contexts/event";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult, HuginnErrorData, omit } from "@huginn/shared";

export function usePatchUser(
   onSuccess?: (result: APIPatchCurrentUserResult) => void,
   handleErrors?: (errors: HuginnErrorData) => void,
) {
   const client = useClient();
   const { dispatchEvent } = useEvent();

   const mutation = useHuginnMutation(
      {
         async mutationFn(data: APIPatchCurrentUserJSONBody) {
            return await client.users.edit(data);
         },
         onSuccess(result) {
            onSuccess?.(result);
            dispatchEvent("user_updated", { user: omit(result, ["token", "refreshToken"]), self: true });
         },
      },
      handleErrors,
   );

   return mutation;
}
