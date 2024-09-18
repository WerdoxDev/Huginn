import { LoadingState } from "@/types";
import useUpdater from "@hooks/useUpdater";
import { createFileRoute } from "@tanstack/react-router";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/splashscreen")({
   component: Splashscreen,
});

function Splashscreen() {
   const { checkAndDownload, info, progress, contentLength, downloaded } = useUpdater(async wasAvailable => {
      setLoadingState("loading");
      if (!wasAvailable) {
         await invoke("close_splashscreen");
      }
   });

   const [loadingState, setLoadingState] = useState<LoadingState>("none");

   const loadingText = useMemo(() => {
      return loadingState === "loading"
         ? "Loading"
         : loadingState === "test"
           ? "Test state takes 5 seconds"
           : loadingState === "checking_update"
             ? "Checking for updates"
             : loadingState === "updating"
               ? `Updating to v${info?.version}`
               : "Invalid State";
   }, [info, loadingState]);

   const updateProgressText = useMemo(() => {
      return `${(downloaded.current / 1024 / 1024).toFixed(2)}MB / ${(contentLength.current / 1024 / 1024).toFixed(2)}MB (${Math.ceil(progress)}%)`;
   }, [downloaded.current, contentLength.current, progress]);

   useEffect(() => {
      if (info) {
         setLoadingState("updating");
      }
   }, [info]);

   useEffect(() => {
      async function checkForUpdate() {
         setLoadingState("checking_update");
         await checkAndDownload();
      }

      checkForUpdate();
   }, []);

   return (
      <div className="bg-background flex h-full w-full select-none items-center justify-center rounded-xl" data-tauri-drag-region>
         <div className="flex w-full flex-col items-center" data-tauri-drag-region>
            <IconFa6SolidCrow className="text-accent mb-2.5 size-20 transition-all hover:-rotate-12 active:rotate-6" />
            <div className="text-text mb-5 text-xl font-bold">Huginn</div>
            <div className="text-text mb-2.5 opacity-60">
               <span>{loadingText}</span>
               <span className="loader__dot">.</span>
               <span className="loader__dot">.</span>
               <span className="loader__dot">.</span>
            </div>
            {loadingState === "updating" && (
               <>
                  <div v-if="loadingState === 'updating'" className="bg-secondary h-4 w-2/3 overflow-hidden rounded-md">
                     <div className="bg-primary h-full" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div v-if="loadingState === 'updating'" className="text-text mt-1 text-xs opacity-60">
                     {updateProgressText}
                  </div>
               </>
            )}
         </div>
      </div>
   );
}
