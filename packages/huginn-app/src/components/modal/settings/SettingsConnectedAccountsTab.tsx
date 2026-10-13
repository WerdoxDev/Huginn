import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useLogout } from "@hooks/useLogout";
import { useOAuth } from "@hooks/useOAuth";
import { HuginnLoadingButton } from "@huginn/frontend-shared";
import { OAuthCode, type OAuthProvider } from "@huginnjs/shared";
import { getAuthMethodsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const providerNames: Record<OAuthProvider, string> = { google: "Google", github: "GitHub" };

export default function SettingsConnectedAccountsTab() {
   const client = useClient();
   const { user, tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const { environment } = useHuginnWindow();
   const queryClient = useQueryClient();
   const startOAuth = useOAuth();
   const logout = useLogout();

   const connectMutation = useHuginnMutation({
      mutationFn: async ({ provider, openedWindow }: { provider: OAuthProvider; openedWindow?: Window | null }) => {
         try {
            const { linkToken } = await client!.users.connectOAuthProvider(provider);
            return await startOAuth(provider, linkToken, openedWindow);
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
   });

   const disconnectMutation = useHuginnMutation({
      mutationFn: async (provider: OAuthProvider) => {
         const payloadCopy = { ...tokenPayload };
         await client!.users.disconnectOAuthProvider(provider);
         return payloadCopy;
      },
      async onSuccess(result, provider) {
         if (result.authType === "oauth" && result.authProvider === provider) {
            await logout();
            return;
         }
         await queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
         updateModals({ info: { isOpen: false } });
      },
   });

   function connect(provider: OAuthProvider) {
      const openedWindow = environment === "browser" ? window.open("about:blank", "_blank") : undefined;
      connectMutation.mutate({ provider, openedWindow });
   }

   function confirmDisconnect(provider: OAuthProvider) {
      updateModals({
         info: {
            isOpen: true,
            status: "info",
            title: `Disconnect ${providerNames[provider]}`,
            text: `You will no longer be able to sign in with ${providerNames[provider]} until you connect it again.${tokenPayload?.authProvider === provider ? " You will need to sign in again." : ""}`,
            action: {
               confirm: { text: "Disconnect", callback: () => disconnectMutation.mutate(provider) },
               cancel: { text: "Cancel", callback: () => updateModals({ info: { isOpen: false } }) },
            },
         },
      });
   }

   const { data: methods, isError, errorUpdatedAt, refetch } = useQuery(getAuthMethodsOptions(client!));

   useEffect(() => {
      if (!isError) return;
      updateModals({
         info: {
            isOpen: true,
            status: "error",
            title: "Could not load sign-in methods",
            text: "Could not load your sign-in methods. Please try again.",
            action: {
               confirm: {
                  text: "Try again",
                  callback: () => {
                     updateModals({ info: { isOpen: false } });
                     void refetch();
                  },
               },
            },
         },
      });
   }, [isError, errorUpdatedAt, refetch, updateModals]);

   return (
      <div className="text-text w-full max-w-xl space-y-5 pr-4">
         <p className="text-text/70 text-sm">See the ways you can sign in to this Huginn account.</p>
         {!methods && !isError && <p className="text-text/70 text-sm">Loading sign-in methods…</p>}
         {methods && !isError && (
            <>
               <div className="bg-surface-alt rounded-lg p-4">
                  <h3 className="font-medium">Password</h3>
                  <p className="text-text/70 mt-1 text-sm">{methods.password.configured ? "Set up" : "Not set up"}</p>
               </div>
               <div className="space-y-2">
                  <h3 className="font-medium">Connected accounts</h3>
                  {methods.providers.map((provider) => (
                     <div key={provider.type} className="bg-surface-alt flex items-center justify-between gap-4 rounded-lg p-4">
                        <span>{providerNames[provider.type]}</span>
                        <div className="flex items-center gap-3">
                           <span className="text-text/70 text-sm">
                              {provider.connected ? "Connected" : provider.available ? "Not connected" : "Not available yet"}
                           </span>
                           {provider.connected ? (
                              <HuginnLoadingButton
                                 type="button"
                                 color="negative"
                                 className="px-3 py-1 text-sm"
                                 isLoading={disconnectMutation.isPending && disconnectMutation.variables === provider.type}
                                 disabled={!methods.password.configured && provider.type === "google"}
                                 onClick={() => confirmDisconnect(provider.type)}
                              >
                                 Disconnect
                              </HuginnLoadingButton>
                           ) : provider.available ? (
                              <HuginnLoadingButton
                                 type="button"
                                 color="primary"
                                 className="px-3 py-1 text-sm"
                                 isLoading={connectMutation.isPending && connectMutation.variables?.provider === provider.type}
                                 onClick={() => connect(provider.type)}
                              >
                                 Connect
                              </HuginnLoadingButton>
                           ) : null}
                        </div>
                     </div>
                  ))}
               </div>
               {!methods.password.configured && methods.providers.some((provider) => provider.type === "google" && provider.connected) && (
                  <p className="text-text/50 text-xs">Set a password before disconnecting your only sign-in method.</p>
               )}
            </>
         )}
      </div>
   );
}
