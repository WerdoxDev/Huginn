import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useLogout } from "@hooks/useLogout";
import { useOAuth } from "@hooks/useOAuth";
import { useRecentAuthentication } from "@hooks/useRecentAuthentication";
import { OAuthCode, type HuginnErrorData, type OAuthProvider } from "@huginnjs/shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";

export const providerNames: Record<OAuthProvider, string> = { google: "Google", github: "GitHub" };

export function useConnectedAccountActions(onPasswordError?: (error: HuginnErrorData) => boolean | void) {
   const client = useClient();
   const { tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const queryClient = useQueryClient();
   const startOAuth = useOAuth();
   const recentAuthentication = useRecentAuthentication();
   const logout = useLogout();

   const connectMutation = useHuginnMutation(
      {
         mutationFn: async ({ provider, openedWindow, password }: { provider: OAuthProvider; openedWindow?: Window | null; password?: string }) => {
            try {
               const connection = await recentAuthentication.run(() => client!.users.connectOAuthProvider(provider, password), {
                  reason: `connect ${providerNames[provider]} to your account`,
                  openedWindow,
               });
               if (!connection) {
                  openedWindow?.close();
                  return;
               }
               const { linkToken } = connection.value;
               return await startOAuth(provider, { linkToken, openedWindow });
            } catch (error) {
               openedWindow?.close();
               throw error;
            }
         },
         async onSuccess(result) {
            if (result?.error && result.error !== OAuthCode.CANCELLED) {
               updateModals({
                  info: {
                     isOpen: true,
                     status: "error",
                     title: "Could not connect account",
                     text: "Linking your account fails. Please try again.",
                  },
               });
            } else if (result?.connected) {
               await queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
            }
         },
      },
      (error) => error.errors?.password && onPasswordError?.(error),
   );

   const disconnectMutation = useHuginnMutation(
      {
         mutationFn: async ({ provider, password }: { provider: OAuthProvider; password?: string }) => {
            const payloadCopy = { ...tokenPayload };
            const disconnected = await recentAuthentication.run(() => client!.users.disconnectOAuthProvider(provider, password), {
               reason: `disconnect ${providerNames[provider]} from your account`,
            });
            if (!disconnected) return;
            return payloadCopy;
         },
         async onSuccess(result, variables) {
            if (!result) return;
            if (result.authType === "oauth" && result.authProvider === variables.provider) {
               await logout();
               return;
            }
            await queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
            updateModals({ info: { isOpen: false } });
         },
      },
      (error) => error.errors?.password && onPasswordError?.(error),
   );

   return { connectMutation, disconnectMutation };
}
