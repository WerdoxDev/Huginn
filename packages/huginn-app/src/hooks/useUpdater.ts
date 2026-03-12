import type { UpdateInfo } from "electron-updater";

import { useHuginnWindow } from "@stores/windowStore";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export function useUpdater(options: { onNotAvailable?: () => void | Promise<void>; onError?: () => void; onUpdating?: () => void }) {
   const huginnWindow = useHuginnWindow();
   const [progress, setProgress] = useState(0);
   const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
   const contentLength = useRef(0);
   const downloaded = useRef(0);
   const isChecking = useRef(false);
   const updateMutation = useMutation({
      mutationKey: ["update"],
      async mutationFn() {
         // options.onTry?.();

         const result = await window.electronAPI.checkUpdate();
         if (result) {
            localStorage.setItem("release-date", result?.releaseDate);
         }

         if (!result || result.version === huginnWindow.version) {
            await options.onNotAvailable?.();
         } else {
            window.electronAPI.downloadUpdate();
            setUpdateInfo(result);
            options.onUpdating?.();
         }
      },
      onError(error) {
         console.log(error);
         isChecking.current = false;
         options.onError?.();
      },
      retry: 2,
      retryDelay: 3000,
   });

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
      if (!isChecking.current) {
         isChecking.current = true;
         updateMutation.mutate();
      }
   }

   return { checkAndDownload, updateInfo, progress, contentLength, downloaded };
}
