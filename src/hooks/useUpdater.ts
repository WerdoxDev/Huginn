import { UnlistenFn, listen } from "@tauri-apps/api/event";
import { checkUpdate as tauriCheckUpdate, installUpdate as tauriInstallUpdate } from "@tauri-apps/api/updater";
import { useEffect, useRef, useState } from "react";

export default function useUpdater() {
   const [progress, setProgress] = useState(0);
   const contentLength = useRef(0);
   const currentLength = useRef(0);

   const unlistenFunction = useRef<UnlistenFn>();

   async function checkUpdate() {
      return tauriCheckUpdate();
   }

   async function installUpdate() {
      if ((await checkUpdate()).shouldUpdate) {
         await tauriInstallUpdate();
      }
   }

   useEffect(() => {
      async function listenToUpdateProgress() {
         unlistenFunction.current = await listen("tauri://update-download-progress", (e) => {
            const payload = e.payload as UpdaterProgress;

            currentLength.current += payload.chunkLength / 2;
            contentLength.current = payload.contentLength;
            setProgress((currentLength.current / payload.contentLength) * 100);
         });
      }

      listenToUpdateProgress();

      return () => {
         unlistenFunction.current && unlistenFunction.current();
      };
   }, []);

   return { checkUpdate, installUpdate, progress, contentLength, currentLength };
}
