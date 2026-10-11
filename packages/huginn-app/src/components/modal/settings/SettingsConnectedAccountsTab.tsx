import type { APIGetAuthMethodsResult, OAuthType } from "@huginnjs/shared";

import { HuginnButton } from "@huginn/frontend-shared";
import { useClient } from "@stores/clientStore";
import { useEffect, useState } from "react";

const providerNames: Record<OAuthType, string> = { google: "Google", github: "GitHub" };

export default function SettingsConnectedAccountsTab() {
   const client = useClient();
   const [methods, setMethods] = useState<APIGetAuthMethodsResult>();
   const [error, setError] = useState(false);
   const [retry, setRetry] = useState(0);

   useEffect(() => {
      if (!client) return;
      let active = true;
      client.users.getAuthMethods().then(
         (result) => {
            if (!active) return;
            setMethods(result);
            setError(false);
         },
         () => {
            if (!active) return;
            setError(true);
         },
      );
      return () => {
         active = false;
      };
   }, [client, retry]);

   return (
      <div className="text-text w-full max-w-xl space-y-5 pr-4">
         <p className="text-text/70 text-sm">See the ways you can sign in to this Huginn account.</p>
         {error && (
            <div className="bg-surface-alt rounded-lg p-4 text-sm">
               <p>Could not load your sign-in methods.</p>
               <HuginnButton className="mt-3 px-3 py-1.5" color="surface" onClick={() => setRetry((value) => value + 1)}>
                  Try again
               </HuginnButton>
            </div>
         )}
         {!methods && !error && <p className="text-text/70 text-sm">Loading sign-in methods…</p>}
         {methods && !error && (
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
