import { LiveUpdate } from "@capawesome/capacitor-live-update";
import { useClientStore } from "@stores/clientStore";
// import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { useHuginnWindow } from "@stores/windowStore";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { UpdateInfo } from "@/types";

import { useCapacitorListener } from "./useCapacitorListener";

export function useUpdater(options: { onNotAvailable?: () => void | Promise<void>; onError?: (message: string) => void; onUpdating?: () => void }) {
   const huginnWindow = useHuginnWindow();
   const [progress, setProgress] = useState(0);
   const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
   const contentLength = useRef(0);
   const downloaded = useRef(0);
   const isChecking = useRef(false);
   const clientStore = useClientStore();

   const desktopUpdateMutation = useMutation({
      mutationKey: ["update"],
      async mutationFn() {
         const result = await window.electronAPI.checkUpdate();

         if (!result || result.version === huginnWindow.version) {
            await options.onNotAvailable?.();
         } else {
            window.electronAPI.downloadUpdate();
            setUpdateInfo({ version: result.version });
            options.onUpdating?.();
         }
      },
      onError(error) {
         console.log(error);
         isChecking.current = false;
         options.onError?.(error.message);
      },
      retry: 2,
      retryDelay: 3000,
   });

   // useCapacitorListener(() =>
   //    CapacitorUpdater.addListener("updateAvailable", async (info) => {
   //       console.log("Update available", info);
   //       await CapacitorUpdater.set({ id: info.bundle.id });
   //       await CapacitorUpdater.reload();
   //    }),
   // );

   // useCapacitorListener(() =>
   //    CapacitorUpdater.addListener("noNeedUpdate", () => {
   //       console.log("No update available");
   //       options.onNotAvailable?.();
   //    }),
   // );

   // useCapacitorListener(() =>
   //    CapacitorUpdater.addListener("downloadFailed", (error) => {
   //       console.log("Download failed", error);
   //       options.onError?.(`Failed to download update for version ${error.version}`);
   //    }),
   // );

   // useCapacitorListener(() =>
   //    CapacitorUpdater.addListener("download", (info) => {
   //       console.log("Download progress", info);
   //       setUpdateInfo({ version: info.bundle.version });
   //       setProgress(info.percent);
   //       options.onUpdating?.();
   //    }),
   // );

   async function androidCheckAndDownload() {
      console.log("Checking for updates...", clientStore.androidUpdateUrl);

      try {
         const result = await fetch(`${clientStore.androidUpdateUrl}/manifest.json`);
         if (!result.ok) {
            options.onError?.(`Failed to check for updates: ${result.status} ${result.statusText}`);
            return;
         }

         const { version, filename, checksum, signature } = await result.json();

         const { bundleId } = await LiveUpdate.getCurrentBundle();
         console.log("Current bundleId", bundleId, "Latest version", version);
         if (version === bundleId || __APP_VERSION__ === version) options.onNotAvailable?.();
         else {
            console.log("Update available", version);
            setUpdateInfo({ version });
            options.onUpdating?.();
            await LiveUpdate.downloadBundle({
               url: `${clientStore.androidUpdateUrl}/${filename}`,
               checksum,
               signature,
               bundleId: version,
               artifactType: "zip",
            });

            await LiveUpdate.setNextBundle({ bundleId: version });
            await LiveUpdate.reload();
         }
      } catch (e) {
         console.error("Error checking for updates:", e);
         options.onError?.(`Failed to check for updates: ${e instanceof Error ? e.message : String(e)}`);
      }
   }

   useEffect(() => {}, [clientStore.androidUpdateUrl]);

   useCapacitorListener(() =>
      LiveUpdate.addListener("downloadBundleProgress", (info) => {
         console.log("Download progress", info);
         downloaded.current = info.downloadedBytes;
         contentLength.current = info.totalBytes;
         setProgress(Math.round(info.progress * 100));
      }),
   );

   useEffect(() => {
      if (huginnWindow.environment !== "desktop") {
         return;
      }

      const unlisten = window.electronAPI.onUpdateProgress((_, info) => {
         downloaded.current = info.transferred;
         contentLength.current = info.total;
         setProgress(info.percent);
      });

      return () => {
         unlisten();
      };
   }, []);

   const checkAndDownload = useEffectEvent(async () => {
      if (huginnWindow.environment == "desktop") {
         if (!isChecking.current) {
            isChecking.current = true;
            desktopUpdateMutation.mutate();
         }
      } else if (huginnWindow.environment === "android") {
         await androidCheckAndDownload();
      }
   });

   return { checkAndDownload, updateInfo, progress, contentLength, downloaded };
}
