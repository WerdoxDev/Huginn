import type { APIDevice } from "@huginnjs/shared";

import { useLogout } from "@hooks/useLogout";
import { HuginnButton } from "@huginn/frontend-shared";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export default function SettingsDevicesTab() {
   const client = useClient();
   const { user } = useThisUser();
   const logout = useLogout();
   const { updateModals } = useModals();
   const queryClient = useQueryClient();
   const devicesQueryKey = ["devices", user?.id];

   const {
      data: devices,
      isError: isDevicesError,
      errorUpdatedAt,
      refetch,
   } = useQuery({
      queryKey: devicesQueryKey,
      queryFn: () => client!.users.getDevices(),
      enabled: !!client && !!user,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: true,
      retry: false,
   });

   useEffect(() => {
      if (!isDevicesError) return;
      updateModals({
         info: {
            isOpen: true,
            status: "error",
            title: "Could not load devices",
            text: "Could not load your devices. Please try again.",
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
   }, [isDevicesError, errorUpdatedAt, refetch, updateModals]);

   const removeMutation = useMutation({
      mutationKey: ["logout-device"],
      async mutationFn(device: APIDevice) {
         if (device.current) {
            await logout();
         } else {
            await client!.users.logoutDevice(device.id);
         }
      },
      onSuccess(_result, device) {
         if (!device.current) {
            queryClient.setQueryData<APIDevice[]>(devicesQueryKey, (current) => current?.filter((item) => item.id !== device.id));
         }
      },
      onError() {
         updateModals({
            info: {
               isOpen: true,
               status: "error",
               title: "Could not sign out device",
               text: "Could not sign out this device. Please try again.",
            },
         });
      },
   });

   return (
      <div className="text-text w-full max-w-xl space-y-4 pr-4">
         <p className="text-text/70 text-sm">Devices with an active sign-in to your account.</p>
         {!devices && !isDevicesError && <p className="text-text/70 text-sm">Loading devices…</p>}
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
               <HuginnButton color="surface" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate(device)}>
                  {removeMutation.isPending && removeMutation.variables?.id === device.id ? "Signing out…" : "Sign out"}
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
