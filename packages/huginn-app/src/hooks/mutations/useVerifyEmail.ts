import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { type APIPostVerifyEmailJSONBody, type APIPostVerifyEmailResult, type HuginnErrorData } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";

export function useVerifyEmail(onSuccess?: (result: APIPostVerifyEmailResult) => void, handleErrors?: (errors: HuginnErrorData) => void) {
   const client = useClient();
   const { setUser } = useThisUser();

   const mutation = useHuginnMutation(
      {
         mutationKey: ["verify-email"],
         async mutationFn(body: APIPostVerifyEmailJSONBody) {
            return await client?.users.verifyEmail(body);
         },
         onSuccess(result) {
            if (!result) return;

            if (result.token && result.refreshToken && client) {
               client.tokenHandler.token = result.token;
               client.tokenHandler.refreshToken = result.refreshToken;
            }

            onSuccess?.(result);
            setUser(result);
         },
      },
      handleErrors,
   );

   return mutation;
}
