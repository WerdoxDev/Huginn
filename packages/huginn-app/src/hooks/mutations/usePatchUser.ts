import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { type APIPatchCurrentUserJSONBody, type APIPatchCurrentUserResult, type HuginnErrorData } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";

export function usePatchUser(
   onSuccess?: (result: APIPatchCurrentUserResult) => void,
   handleErrors?: (errors: HuginnErrorData) => Promise<boolean | void> | boolean | void,
) {
   const client = useClient();
   const { setUser } = useThisUser();

   const mutation = useHuginnMutation(
      {
         mutationKey: ["patch-user"],
         async mutationFn(data: APIPatchCurrentUserJSONBody) {
            return await client?.users.edit(data);
         },
         onSuccess(result) {
            if (!result || !client) return;

            onSuccess?.(result);
            setUser(result);
         },
      },
      handleErrors,
   );

   return mutation;
}
