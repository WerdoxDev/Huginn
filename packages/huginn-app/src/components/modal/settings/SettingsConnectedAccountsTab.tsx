import type { OAuthType } from "@huginnjs/shared";

import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const providerNames: Record<OAuthType, string> = { google: "Google", github: "GitHub" };

export default function SettingsConnectedAccountsTab() {
   const client = useClient();
   const { user } = useThisUser();
   const { updateModals } = useModals();

   const {
      data: methods,
      isError,
      errorUpdatedAt,
      refetch,
   } = useQuery({
      queryKey: ["auth-methods", user?.id],
      queryFn: () => client!.users.getAuthMethods(),
      enabled: !!client && !!user,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: true,
      retry: false,
   });

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
                        <span className="text-text/70 text-sm">
                           {provider.connected ? "Connected" : provider.available ? "Not connected" : "Not available yet"}
                        </span>
                     </div>
                  ))}
               </div>
               <p className="text-text/50 text-xs">Connecting and disconnecting accounts will be available here in a later update.</p>
            </>
         )}
      </div>
   );
}
