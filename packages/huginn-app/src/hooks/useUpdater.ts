import { App } from "@capacitor/app";
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
   const [{ progress, contentLength, downloaded }, setDownloadProgress] = useState({ progress: 0, contentLength: 0, downloaded: 0 });
   const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
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
         const { version: nativeVersion } = await App.getInfo();
         const query = new URLSearchParams({ nativeVersion });
         const result = await fetch(`${clientStore.androidUpdateUrl}/manifest.json?${query}`);
         if (result.status === 204) {
            await options.onNotAvailable?.();
            return;
         }
         if (!result.ok) {
            options.onError?.(`Failed to check for updates: ${result.status} ${result.statusText}`);
            return;
         }

         const { version, filename, checksum, signature, size } = await result.json();

         const { bundleId } = await LiveUpdate.getCurrentBundle();
         console.log("Current bundleId", bundleId, "Latest version", version);
         if (version === bundleId || __APP_VERSION__ === version) options.onNotAvailable?.();
         else {
            console.log("Update available", version);
            setDownloadProgress({ progress: 0, contentLength: Number.isFinite(size) && size > 0 ? size : 0, downloaded: 0 });
            setUpdateInfo({ version });
            options.onUpdating?.();
            await LiveUpdate.downloadBundle({
               url: `${clientStore.androidUpdateUrl}/${filename}?${query}`,
               checksum,
               signature,
               bundleId: version,
               artifactType: "zip",
            });
            setDownloadProgress((previous) => {
               const total = previous.contentLength || previous.downloaded;
               return { progress: 100, contentLength: total, downloaded: total };
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
         setDownloadProgress((previous) => {
            // Android reports -1 when the response has no Content-Length. Keep the manifest size as a fallback.
            const total = Number.isFinite(info.totalBytes) && info.totalBytes > 0 ? info.totalBytes : previous.contentLength;
            return {
               downloaded: info.downloadedBytes,
               contentLength: total,
               progress: total > 0 ? Math.min(100, Math.max(0, (info.downloadedBytes / total) * 100)) : 0,
            };
         });
      }),
   );

   useEffect(() => {
      if (huginnWindow.environment !== "desktop") {
         return;
      }

      const unlisten = window.electronAPI.onUpdateProgress((_, info) => {
         setDownloadProgress({ downloaded: info.transferred, contentLength: info.total, progress: info.percent });
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
