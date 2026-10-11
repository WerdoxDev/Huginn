import type { APIDevice } from "@huginnjs/shared";

import { useLogout } from "@hooks/useLogout";
import { HuginnButton } from "@huginn/frontend-shared";
import { useClient } from "@stores/clientStore";
import { useEffect, useState } from "react";

export default function SettingsDevicesTab() {
   const client = useClient();
   const logout = useLogout();
   const [devices, setDevices] = useState<APIDevice[]>();
   const [error, setError] = useState<string>();
   const [busyId, setBusyId] = useState<string>();
   const [retry, setRetry] = useState(0);

   useEffect(() => {
      if (!client) return;
      let active = true;
      client.users.getDevices().then(
         (result) => {
            if (active) {
               setDevices(result);
               setError(undefined);
            }
         },
         () => {
            if (active) setError("Could not load your devices.");
         },
      );
      return () => {
         active = false;
      };
   }, [client, retry]);

   async function remove(device: APIDevice) {
      if (!client || busyId) return;
      setBusyId(device.id);
      setError(undefined);
      try {
         if (device.current) {
            await logout();
         } else {
            await client.users.logoutDevice(device.id);
            setDevices((current) => current?.filter((item) => item.id !== device.id));
         }
      } catch {
         setError("Could not sign out this device. Try again.");
      } finally {
         setBusyId(undefined);
      }
   }

   return (
      <div className="text-text w-full max-w-xl space-y-4 pr-4">
         <p className="text-text/70 text-sm">Devices with an active sign-in to your account.</p>
         {error && (
            <div className="bg-surface-alt rounded-lg p-4 text-sm">
               <p>{error}</p>
               <HuginnButton className="mt-3 px-3 py-1.5" color="surface" onClick={() => setRetry((value) => value + 1)}>
                  Try again
               </HuginnButton>
            </div>
         )}
         {!devices && !error && <p className="text-text/70 text-sm">Loading devices…</p>}
         {devices?.map((device) => (
            <div key={device.id} className="bg-surface-alt flex items-center justify-between gap-4 rounded-lg p-4">
               <div className="min-w-0">
                  <p className="font-medium">
                     {device.current
                        ? `This device · ${device.deviceName ?? deviceName(device.userAgent)}`
                        : (device.deviceName ?? deviceName(device.userAgent))}
                  </p>
                  <p className="text-text/70 truncate text-xs" title={device.userAgent ?? undefined}>
                     {device.userAgent ?? "Device details unavailable"}
                  </p>
                  <p className="text-text/70 mt-1 text-xs">
                     Signed in with {device.authType === "password" ? "password" : device.authType === "google" ? "Google" : "GitHub"} on{" "}
                     {new Date(device.createdAt).toLocaleString()}
                     {" · "}Last active {new Date(device.lastSeenAt).toLocaleString()}
                  </p>
               </div>
               <HuginnButton color="surface" disabled={!!busyId} onClick={() => void remove(device)}>
                  {busyId === device.id ? "Signing out…" : "Sign out"}
               </HuginnButton>
            </div>
         ))}
         {devices?.length === 0 && <p className="text-text/70 text-sm">No active devices found.</p>}
      </div>
   );
}

function deviceName(userAgent: string | null): string {
   if (!userAgent) return "Unknown device";
   const platform = /Android/i.test(userAgent)
      ? "Android"
      : /iPhone|iPad/i.test(userAgent)
        ? "iOS"
        : /Windows/i.test(userAgent)
          ? "Windows"
          : /Mac OS X|Macintosh/i.test(userAgent)
            ? "macOS"
            : /Linux/i.test(userAgent)
              ? "Linux"
              : "Unknown platform";
   const app = /Electron/i.test(userAgent)
      ? "Huginn Desktop"
      : /Chrome/i.test(userAgent)
        ? "Chrome"
        : /Firefox/i.test(userAgent)
          ? "Firefox"
          : /Safari/i.test(userAgent)
            ? "Safari"
            : "Browser";
   return `${app} on ${platform}`;
}
