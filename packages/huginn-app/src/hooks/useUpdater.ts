import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { useHuginnWindow } from "@stores/windowStore";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import type { UpdateInfo } from "@/types";

import { useCapacitorListener } from "./useCapacitorEvent";

export function useUpdater(options: { onNotAvailable?: () => void | Promise<void>; onError?: (message: string) => void; onUpdating?: () => void }) {
   const huginnWindow = useHuginnWindow();
   const [progress, setProgress] = useState(0);
   const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
   const contentLength = useRef(0);
   const downloaded = useRef(0);
   const isChecking = useRef(false);

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

   useCapacitorListener(() =>
      CapacitorUpdater.addListener("updateAvailable", async (info) => {
         console.log("Update available", info);
         await CapacitorUpdater.set({ id: info.bundle.id });
         await CapacitorUpdater.reload();
      }),
   );

   useCapacitorListener(() =>
      CapacitorUpdater.addListener("noNeedUpdate", () => {
         console.log("No update available");
         options.onNotAvailable?.();
      }),
   );

   useCapacitorListener(() =>
      CapacitorUpdater.addListener("downloadFailed", (error) => {
         console.log("Download failed", error);
         options.onError?.(`Failed to download update for version ${error.version}`);
      }),
   );

   // useCapacitorListener(() =>
   //    CapacitorUpdater.addListener("downloadComplete", (info) => {
   //       if (huginnWindow.environment === "android") {

   useCapacitorListener(() =>
      CapacitorUpdater.addListener("download", (info) => {
         console.log("Download progress", info);
         setUpdateInfo({ version: info.bundle.version });
         setProgress(info.percent);
         options.onUpdating?.();
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

   async function checkAndDownload() {
      if (huginnWindow.environment == "desktop") {
         if (!isChecking.current) {
            isChecking.current = true;
            desktopUpdateMutation.mutate();
         }
      } else if (huginnWindow.environment === "android") {
         console.log("Checking for updates...");
         const result = await CapacitorUpdater.triggerUpdateCheck();
         console.log("Update check result:", result);
      }
   }

   return { checkAndDownload, updateInfo, progress, contentLength, downloaded };
}
