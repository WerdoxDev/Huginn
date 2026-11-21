import { isChildWindow } from "@lib/child-window";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
   window.addEventListener("resize", onChange);
   return () => window.removeEventListener("resize", onChange);
}

function checkMobile() {
   return window.innerWidth < 1024 && !isChildWindow();
}

export function useIsMobile() {
   return useSyncExternalStore(subscribe, checkMobile);
}
