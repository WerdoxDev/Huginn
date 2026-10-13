import PasswordInput from "@components/input/PasswordInput";
import BaseModal from "@components/modal/BaseModal";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useHuginnMutation } from "@hooks/useHuginnMutation";
import { useLogout } from "@hooks/useLogout";
import { useOAuth } from "@hooks/useOAuth";
import { useRecentAuthentication } from "@hooks/useRecentAuthentication";
import {
   DialogActions,
   DialogBody,
   HuginnButton,
   HuginnDialogPanel,
   HuginnDialogTitle,
   HuginnInput,
   HuginnLoadingButton,
} from "@huginn/frontend-shared";
import { OAuthCode, type OAuthProvider } from "@huginnjs/shared";
import { getAuthMethodsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const providerNames: Record<OAuthProvider, string> = { google: "Google", github: "GitHub" };
type PendingAction = { type: "connect" | "disconnect"; provider: OAuthProvider };

export default function SettingsConnectedAccountsTab() {
   const client = useClient();
   const { tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const { environment } = useHuginnWindow();
   const queryClient = useQueryClient();
   const startOAuth = useOAuth();
   const recentAuthentication = useRecentAuthentication();
   const logout = useLogout();
   const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
   const { register, handleSubmit, handleErrors, reset, formState } = useHuginnForm<{ password: string }>();

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
      (error) => {
         if (pendingAction && error.errors?.password) return handleErrors(error);
      },
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
         async onSuccess(result, provider) {
            if (!result) return;
            if (result.authType === "oauth" && result.authProvider === provider.provider) {
               await logout();
               return;
            }
            await queryClient.invalidateQueries({ queryKey: ["auth-methods"] });
            updateModals({ info: { isOpen: false } });
         },
      },
      (error) => {
         if (pendingAction && error.errors?.password) return handleErrors(error);
      },
   );

   function requestPassword(action: PendingAction) {
      reset({ password: "" });
      setPendingAction(action);
   }

   async function confirmPassword({ password }: { password: string }, openedWindow?: Window | null) {
      if (!pendingAction) return;
      try {
         if (pendingAction.type === "connect") {
            await connectMutation.mutateAsync({ provider: pendingAction.provider, password, openedWindow });
         } else {
            await disconnectMutation.mutateAsync({ provider: pendingAction.provider, password });
         }
         setPendingAction(null);
      } catch {
         // The mutation displays server errors in the password field.
      }
   }

   function connect(provider: OAuthProvider) {
      if (tokenPayload?.authType === "password") return requestPassword({ type: "connect", provider });
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
               confirm: {
                  text: "Disconnect",
                  callback: () => {
                     updateModals({ info: { isOpen: false } });
                     if (tokenPayload?.authType === "password") requestPassword({ type: "disconnect", provider });
                     else disconnectMutation.mutate({ provider });
                  },
               },
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
      <>
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
                                    isLoading={disconnectMutation.isPending && disconnectMutation.variables?.provider === provider.type}
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
         <BaseModal
            modal={{ isOpen: pendingAction !== null }}
            onClose={() => setPendingAction(null)}
            renderChildren={
               <HuginnDialogPanel className="lg:max-w-xs">
                  <form
                     onSubmit={(event) => {
                        const openedWindow =
                           pendingAction?.type === "connect" && environment === "browser" ? window.open("about:blank", "_blank") : undefined;
                        void handleSubmit(
                           (data) => confirmPassword(data, openedWindow),
                           () => openedWindow?.close(),
                        )(event);
                     }}
                  >
                     <DialogBody>
                        <HuginnDialogTitle
                           title={`${pendingAction?.type === "connect" ? "Connect" : "Disconnect"} ${providerNames[pendingAction?.provider ?? "google"]}`}
                        />
                        <PasswordInput {...register("password", { required: true })}>
                           <HuginnInput.Label>Current Password</HuginnInput.Label>
                           <HuginnInput.Wrapper>
                              <HuginnInput.Input />
                              <PasswordInput.ToggleButton />
                           </HuginnInput.Wrapper>
                        </PasswordInput>
                     </DialogBody>
                     <DialogActions>
                        <HuginnButton type="button" color="surface" className="h-10 w-full" onClick={() => setPendingAction(null)}>
                           Cancel
                        </HuginnButton>
                        <HuginnLoadingButton type="submit" color="primary" className="h-10 w-full" isLoading={formState.isSubmitting}>
                           {pendingAction?.type === "connect" ? "Connect" : "Disconnect"}
                        </HuginnLoadingButton>
                     </DialogActions>
                  </form>
               </HuginnDialogPanel>
            }
         />
      </>
   );
}
