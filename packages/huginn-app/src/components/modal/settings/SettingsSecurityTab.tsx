import type { OAuthProvider } from "@huginnjs/shared";

import { usePatchUser } from "@hooks/mutations/usePatchUser";
import { providerNames, useConnectedAccountActions } from "@hooks/useConnectedAccountActions";
import { useIsOAuth } from "@hooks/useIsOAuth";
import { useLogout } from "@hooks/useLogout";
import { useRecentAuthentication } from "@hooks/useRecentAuthentication";
import { HuginnButton, HuginnLabel, HuginnLoadingButton, HuginnLoadingIcon } from "@huginn/frontend-shared";
import { getAuthMethodsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, type ReactNode } from "react";

const providerIcons: Record<OAuthProvider, ReactNode> = {
   google: <IconLogosGoogleIcon className="text-text size-7" />,
   github: <IconLogosGithubIcon className="text-text size-7" />,
};

export default function SettingsSecurityTab() {
   const client = useClient();
   const { user, tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const { environment } = useHuginnWindow();
   const isOAuth = useIsOAuth();
   const logout = useLogout();
   const recentAuthentication = useRecentAuthentication();
   const { connectMutation, disconnectMutation } = useConnectedAccountActions();
   const { data: methods, isError, errorUpdatedAt, refetch } = useQuery(getAuthMethodsOptions(client!));
   const removePasswordMutation = usePatchUser(undefined, (error) =>
      recentAuthentication.handleMutationError(error, undefined, (retryError) => {
         updateModals({ info: { isOpen: true, status: "error", title: "Could not verify account", text: retryError.message } });
         return true;
      }),
   );

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

   function requestPassword(action: "connect" | "disconnect", provider: OAuthProvider) {
      updateModals({ connectedAccountPassword: { isOpen: true, action, provider } });
   }

   function connect(provider: OAuthProvider) {
      if (tokenPayload?.authType === "password") return requestPassword("connect", provider);
      const openedWindow = environment === "browser" ? window.open("about:blank", "_blank") : undefined;
      connectMutation.mutate({ provider, openedWindow });
   }

   function confirmDisconnect(provider: OAuthProvider) {
      if (!methods?.password.configured && !methods?.providers.some((other) => other.type !== provider && other.connected && other.available)) {
         updateModals({
            info: {
               isOpen: true,
               status: "error",
               title: "Cannot disconnect provider",
               text: "You must have at least one other connected sign-in method like password or another OAuth provider to disconnect this provider.",
            },
         });
         return;
      }

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
                     if (tokenPayload?.authType === "password") requestPassword("disconnect", provider);
                     else disconnectMutation.mutate({ provider });
                  },
               },
               cancel: { text: "Cancel", callback: () => updateModals({ info: { isOpen: false } }) },
            },
         },
      });
   }

   function handleRemovePassword() {
      if (methods?.providers.every((provider) => !provider.connected || !provider.available)) {
         updateModals({
            info: {
               isOpen: true,
               status: "error",
               title: "Cannot remove password",
               text: "You must have at least one connected OAuth provider to remove your password.",
            },
         });
         return;
      }

      updateModals({
         info: {
            isOpen: true,
            status: "info",
            title: "Remove Password",
            text: (
               <div>
                  Are you sure you want to remove your password?{" "}
                  <span className="font-bold">You will have to sign in again using a configured OAuth provider</span>.
               </div>
            ),
            action: {
               confirm: {
                  text: "Remove",
                  callback: async () => {
                     if (!isOAuth) {
                        updateModals({ info: { isOpen: false }, changePassword: { isOpen: true, removePassword: true } });
                        return;
                     }

                     if (!tokenPayload?.authProvider) {
                        updateModals({
                           info: { isOpen: true, status: "error", title: "Could not verify account", text: "Sign in again and retry." },
                        });
                        return;
                     }

                     try {
                        const result = await recentAuthentication.run(() => removePasswordMutation.mutateAsync({ newPassword: null }), {
                           reason: "remove your password",
                           authenticateIfStale: true,
                        });
                        if (!result) return;
                     } catch {
                        // The mutation displays server errors.
                        return;
                     }

                     updateModals({ info: { isOpen: false } });
                     await logout();
                  },
               },
               cancel: { text: "Cancel", callback: () => updateModals({ info: { isOpen: false } }) },
            },
         },
      });
   }

   const passwordStatus = methods ? (methods.password.configured ? "Set up" : "Not set up") : isError ? "Status unavailable" : "Checking…";
   const currentSessionMethod =
      tokenPayload?.authType === "password"
         ? "Password"
         : tokenPayload?.authProvider
           ? (providerNames[tokenPayload.authProvider] ?? "OAuth")
           : "OAuth";

   return (
      <div className="flex w-full flex-col items-center">
         <div className="flex w-full max-w-xl flex-col gap-y-6">
            <div className="text-text/70 text-sm">Manage the ways you can sign in to your Huginn account.</div>
            <div>
               <HuginnLabel>Email and Password</HuginnLabel>
               <div className="bg-surface-alt rounded-lg p-4">
                  <div className="flex w-full items-center justify-between gap-x-3">
                     <div className="min-w-0">
                        <HuginnLabel className="mb-0!">Email</HuginnLabel>
                        <div className="truncate text-white" title={user?.email}>
                           {user?.email}
                        </div>
                     </div>
                     <HuginnButton className="h-8 shrink-0 px-3" color="surface" onClick={() => updateModals({ changeEmail: { isOpen: true } })}>
                        Change
                     </HuginnButton>
                  </div>
                  <div className="bg-surface my-4 h-px w-full" />
                  <div className="flex w-full items-center justify-between gap-x-3">
                     <div>
                        <HuginnLabel className="mb-0!">Password</HuginnLabel>
                        <div className="text-text/70">{passwordStatus}</div>
                     </div>
                     <div className="flex shrink-0 gap-x-2">
                        {methods?.password.configured && (
                           <HuginnButton className="h-8 px-3" color="negative" onClick={handleRemovePassword}>
                              Remove
                           </HuginnButton>
                        )}
                        <HuginnButton
                           className="h-8 px-3"
                           color="surface"
                           onClick={() => updateModals({ changePassword: { isOpen: true, removePassword: false } })}
                        >
                           {methods?.password.configured === false ? "Set" : "Change"}
                        </HuginnButton>
                     </div>
                  </div>
               </div>
            </div>

            <div>
               <HuginnLabel>OAuth providers</HuginnLabel>
               {!methods && !isError && (
                  <div className="flex items-center justify-center gap-x-2 py-4">
                     <div className="text-text">Loading providers…</div>
                     <HuginnLoadingIcon className="size-6" />
                  </div>
               )}
               <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {methods?.providers.map((provider) => (
                     <div
                        key={provider.type}
                        className={clsx(
                           "bg-surface-alt flex flex-col items-stretch justify-between gap-4 rounded-lg p-4",
                           provider.connected && "ring-primary-700 ring-2",
                        )}
                     >
                        <div className="flex min-w-0 items-center gap-x-3">
                           <div className="shrink-0">{providerIcons[provider.type]}</div>
                           <div className="min-w-0">
                              <div className="text-text">{providerNames[provider.type]}</div>
                              <div className="text-text/70 truncate text-sm" title={provider.accountIdentifier ?? undefined}>
                                 {provider.connected
                                    ? provider.accountIdentifier || "Connected"
                                    : provider.available
                                      ? "Not connected"
                                      : "Unavailable"}
                              </div>
                           </div>
                        </div>
                        {provider.connected ? (
                           <HuginnLoadingButton
                              type="button"
                              color="negative"
                              className="w-full py-1"
                              isLoading={disconnectMutation.isPending && disconnectMutation.variables?.provider === provider.type}
                              iconClassName="size-6!"
                              onClick={() => confirmDisconnect(provider.type)}
                           >
                              Disconnect
                           </HuginnLoadingButton>
                        ) : (
                           <HuginnLoadingButton
                              type="button"
                              color="primary"
                              className="w-full py-1"
                              iconClassName="size-6!"
                              isLoading={connectMutation.isPending && connectMutation.variables?.provider === provider.type}
                              disabled={!provider.available}
                              onClick={() => connect(provider.type)}
                           >
                              Connect
                           </HuginnLoadingButton>
                        )}
                     </div>
                  ))}
               </div>
            </div>

            <div>
               <HuginnLabel>Passkeys</HuginnLabel>
               <div className="bg-surface-alt flex items-center gap-x-3 rounded-lg p-4">
                  <IconMingcuteKey2Fill className="text-text size-7 shrink-0" />
                  <div>
                     <div className="text-text">Passkeys</div>
                     <div className="text-text/70 text-sm">Passkey support is coming soon.</div>
                  </div>
               </div>
            </div>

            <div>
               <HuginnLabel>Current session</HuginnLabel>
               <div className="bg-surface-alt rounded-lg p-4">
                  <div className="text-text">
                     Signed in with <span className="font-medium">{currentSessionMethod}</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
