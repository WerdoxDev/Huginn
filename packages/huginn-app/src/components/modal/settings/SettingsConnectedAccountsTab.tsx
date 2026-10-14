import type { OAuthProvider } from "@huginnjs/shared";

import { providerNames, useConnectedAccountActions } from "@hooks/useConnectedAccountActions";
import { HuginnLoadingButton, HuginnLoadingIcon } from "@huginn/frontend-shared";
import { getAuthMethodsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, type ReactNode } from "react";

const providerIcons: Record<OAuthProvider, ReactNode> = {
   github: <IconMingcuteGithubFill className="text-text size-7" />,
   google: <IconMingcuteGoogleFill className="text-text size-7" />,
};

export default function SettingsConnectedAccountsTab() {
   const client = useClient();
   const { tokenPayload } = useThisUser();
   const { updateModals } = useModals();
   const { environment } = useHuginnWindow();
   const { connectMutation, disconnectMutation } = useConnectedAccountActions();

   function requestPassword(action: "connect" | "disconnect", provider: OAuthProvider) {
      updateModals({ connectedAccountPassword: { isOpen: true, action, provider } });
   }

   function connect(provider: OAuthProvider) {
      if (tokenPayload?.authType === "password") return requestPassword("connect", provider);
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
                     if (tokenPayload?.authType === "password") requestPassword("disconnect", provider);
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
         <div className="flex w-full flex-col items-center">
            <div className="w-full max-w-xl">
               {!methods && !isError && (
                  <div className="flex items-center justify-center gap-x-2">
                     <div className="text-text">Loading connected accounts…</div>
                     <HuginnLoadingIcon className="size-6" />
                  </div>
               )}
               <div className="mt-0.5 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                              {provider.connected && (
                                 <div className="text-text/70 truncate text-sm" title={provider.accountIdentifier ?? undefined}>
                                    {provider.accountIdentifier || "Connected"}
                                 </div>
                              )}
                           </div>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                           {provider.connected ? (
                              <HuginnLoadingButton
                                 type="button"
                                 color="negative"
                                 className="w-full py-1"
                                 isLoading={disconnectMutation.isPending && disconnectMutation.variables?.provider === provider.type}
                                 disabled={!methods.password.configured && !methods.providers.some((other) => other.type !== provider.type && other.connected && other.available)}
                                 onClick={() => confirmDisconnect(provider.type)}
                              >
                                 Disconnect
                              </HuginnLoadingButton>
                           ) : (
                              <HuginnLoadingButton
                                 type="button"
                                 color="primary"
                                 className="w-full py-1"
                                 isLoading={connectMutation.isPending && connectMutation.variables?.provider === provider.type}
                                 disabled={!provider.available}
                                 onClick={() => connect(provider.type)}
                              >
                                 Connect
                              </HuginnLoadingButton>
                           )}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </>
   );
}
