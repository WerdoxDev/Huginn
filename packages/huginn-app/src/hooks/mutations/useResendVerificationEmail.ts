import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { type HuginnErrorData } from "@huginn/shared";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";

export function useResendVerificationEmail(onSuccess?: () => void, handleErrors?: (errors: HuginnErrorData) => void) {
   const client = useClient();
   const { setUser } = useThisUser();

   const mutation = useHuginnMutation(
      {
         mutationKey: ["resend-verification-email"],
         async mutationFn() {
            return await client?.users.resendVerificationEmail();
         },
         onSuccess(result) {
            if (!result) return;

            onSuccess?.();
            setUser(result);
         },
      },
      handleErrors,
   );

   return mutation;
}
