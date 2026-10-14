import type { APIDevice } from "@huginnjs/shared";

import { useLogout } from "@hooks/useLogout";
import { HuginnLoadingButton, HuginnLoadingIcon } from "@huginn/frontend-shared";
import { getDevicesOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import moment from "moment";
import { useEffect } from "react";

export default function SettingsDevicesTab() {
   const client = useClient();
   const logout = useLogout();
   const { updateModals } = useModals();

   const { data: devices, isError, errorUpdatedAt, refetch } = useQuery(getDevicesOptions(client!));

   useEffect(() => {
      if (!isError) return;
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
   }, [isError, errorUpdatedAt, refetch, updateModals]);

   const removeMutation = useMutation({
      mutationKey: ["logout-device"],
      async mutationFn(device: APIDevice) {
         if (device.current) {
            await logout();
         } else {
            await client!.users.logoutDevice(device.id);
         }
      },
      async onSuccess(_result, device) {
         if (!device.current) {
            refetch();
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

   function confirmSignOut(device: APIDevice) {
      if (removeMutation.isPending) return;
      updateModals({
         info: {
            isOpen: true,
            status: "info",
            title: "Sign out device?",
            text: device.current
               ? "This will sign you out on this device."
               : `This will sign out ${device.deviceName ?? device.clientName ?? "this device"} from your account.`,
            action: {
               confirm: {
                  text: "Sign out",
                  callback: () => {
                     updateModals({ info: { isOpen: false } });
                     removeMutation.mutate(device);
                  },
               },
               cancel: {
                  text: "Cancel",
                  callback: () => updateModals({ info: { isOpen: false } }),
               },
            },
         },
      });
   }

   return (
      <div className="flex w-full flex-col items-center">
         <div className="mt-0.5 flex w-full max-w-xl flex-col gap-y-4">
            {!devices && !isError && (
               <div className="flex items-center justify-center gap-x-2">
                  <div className="text-text">Loading devices…</div>
                  <HuginnLoadingIcon className="size-6" />
               </div>
            )}
            {devices?.map((device) => (
               <div
                  key={device.id}
                  className={clsx("bg-surface-alt flex items-center gap-x-4 rounded-lg p-4", device.current && "ring-primary-700 ring-2")}
               >
                  {device.clientOs === "linux" ? (
                     <IconMingcuteLinuxFill className="text-text size-8 shrink-0" />
                  ) : device.clientOs === "windows" ? (
                     <IconMingcuteWindowsFill className="text-text size-8 shrink-0" />
                  ) : device.clientOs === "android" ? (
                     <IconMingcuteAndroidFill className="text-text size-8 shrink-0" />
                  ) : (
                     <IconMingcuteQuestion2Fill className="text-text size-8 shrink-0" />
                  )}
                  <div className="flex flex-col gap-y-1">
                     <div className="flex gap-x-2">
                        <div className="text-text font-medium">
                           {device.clientName ?? "Unknown"} - {device.clientOs ?? "Unknown"} - "{device.deviceName ?? "Unknown"}"
                        </div>
                        {device.current && (
                           <div className="bg-primary-700 flex items-center justify-center rounded px-1.5 text-xs font-bold text-white uppercase">
                              Your Device
                           </div>
                        )}
                     </div>

                     <div className="text-text/70 text-sm">
                        Last active <span className="text-text/80">{moment(device.lastSeenAt).format("MM.DD.YYYY [at] h:mm A")}</span> (
                        {moment(device.lastSeenAt).fromNow()})
                     </div>
                     <div className="text-text/70 text-sm">
                        Signed in with {device.authProvider === "google" ? "Google" : device.authType === "password" ? "password" : "OAuth"}
                     </div>
                  </div>
                  <HuginnLoadingButton
                     color="negative"
                     className="ml-auto shrink-0 px-2 py-1"
                     disabled={removeMutation.isPending}
                     isLoading={removeMutation.isPending && removeMutation.variables?.id === device.id}
                     onClick={() => confirmSignOut(device)}
                  >
                     Sign out
                  </HuginnLoadingButton>
               </div>
            ))}
         </div>
         {devices?.length === 0 && <div className="text-text/70 text-sm">No active devices found.</div>}
      </div>
   );
}
