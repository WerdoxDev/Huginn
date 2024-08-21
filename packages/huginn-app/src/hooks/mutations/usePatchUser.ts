import { useClient } from "@contexts/apiContext";
import { useEvent } from "@contexts/event";
import { useUser } from "@contexts/userContext";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult, HuginnErrorData, omit } from "@huginn/shared";

export function usePatchUser(
   onSuccess?: (result: APIPatchCurrentUserResult) => void,
   handleErrors?: (errors: HuginnErrorData) => void,
) {
   const client = useClient();
   const { dispatchEvent } = useEvent();
   const { setUser } = useUser();

   const mutation = useHuginnMutation(
      {
         async mutationFn(data: APIPatchCurrentUserJSONBody) {
            return await client.users.edit(data);
         },
         onSuccess(result) {
            onSuccess?.(result);
            const data = omit(result, ["token", "refreshToken"]);

            setUser(data);
            dispatchEvent("user_updated", { user: data, self: true });
         },
      },
      handleErrors,
   );

   return mutation;
}
