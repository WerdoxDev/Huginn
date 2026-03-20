import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionStatus = "idle" | "checking" | "connected" | "error";

export function useConnectionStatus(hostname: string, delay = 500): { status: ConnectionStatus; retry: () => void } {
   const [status, setStatus] = useState<ConnectionStatus>("idle");
   const [retryCount, setRetryCount] = useState(0);
   const timeoutRef = useRef<number | undefined>(undefined);
   const abortRef = useRef<AbortController | null>(null);
   const hostnameRef = useRef(hostname);
   hostnameRef.current = hostname;

   const checkConnection = useCallback(
      (hostnameValue: string, withDelay: boolean) => {
         if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
         }
         if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
         }

         const trimmed = hostnameValue.trim().replace(/\/$/, "");
         if (!trimmed) {
            setStatus("idle");
            return;
         }

         setStatus("checking");

         const run = async () => {
            const controller = new AbortController();
            abortRef.current = controller;

            try {
               const response = await fetch(trimmed, {
                  method: "HEAD",
                  signal: controller.signal,
                  mode: "no-cors",
               });

               if (!controller.signal.aborted) {
                  setStatus("connected");
               }
            } catch {
               if (!controller.signal.aborted) {
                  setStatus("error");
               }
            }
         };

         if (withDelay) {
            timeoutRef.current = window.setTimeout(run, delay);
         } else {
            run();
         }
      },
      [delay],
   );

   useEffect(() => {
      checkConnection(hostname, true);

      return () => {
         if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
         }
         if (abortRef.current) {
            abortRef.current.abort();
         }
      };
   }, [hostname, delay, retryCount, checkConnection]);

   const retry = useCallback(() => {
      setRetryCount((c) => c + 1);
   }, []);

   return { status, retry };
}
