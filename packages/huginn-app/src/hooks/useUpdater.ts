import { check as tauriCheck } from "@tauri-apps/plugin-updater";
import { useRef, useState } from "react";

export default function useUpdater() {
   const [progress, setProgress] = useState(0);
   const contentLength = useRef(0);
   const downloaded = useRef(0);

   async function check() {
      return await tauriCheck();
   }

   async function downloadAndInstall() {
      const update = await check();

      if (update?.available) {
         await update.downloadAndInstall(event => {
            if (event.event === "Started") {
               contentLength.current = event.data.contentLength || 0;
            } else if (event.event === "Progress") {
               downloaded.current += event.data.chunkLength;
               setProgress((downloaded.current / contentLength.current) * 100);
            }
         });
      }
   }

   return { check, downloadAndInstall, progress, contentLength, downloaded };
}
