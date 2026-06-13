import KeyboardInset from "@lib/capacitor/keyboard-inset-plugin";
import { useHuginnWindow } from "@stores/windowStore";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const KeyboardContext = createContext<{
   isKeyboardOpen: boolean;
   lastKeyboardHeight: number;
   shouldResizeWindow: boolean;
}>({
   isKeyboardOpen: false,
   lastKeyboardHeight: 0,
   shouldResizeWindow: true,
});

const elementSuppressesResize = (el: Element | null) => el?.classList.contains("keyboard-no-resize") ?? false;

export function KeyboardProvider(props: { children: ReactNode }) {
   const huginnWindow = useHuginnWindow();

   const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
   const [lastKeyboardHeight, setLastKeyboardHeight] = useState(0);
   const [shouldResizeWindow, setShouldResizeWindow] = useState(true);
   const focusedElementRef = useRef<Element | null>(null);

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      const abortController = new AbortController();

      window.addEventListener(
         "focusin",
         (e) => {
            const target = e.target as Element;
            focusedElementRef.current = target;

            if (!isKeyboardOpen && elementSuppressesResize(target)) {
               setShouldResizeWindow(false);
            } else if (isKeyboardOpen && willOpenKeyboard(target) && elementSuppressesResize(target)) {
               setShouldResizeWindow(false);
            } else if (!isKeyboardOpen && willOpenKeyboard(target) && !elementSuppressesResize(target)) {
               setShouldResizeWindow(true);
            }
         },
         { signal: abortController.signal },
      );

      return () => abortController.abort();
   }, [isKeyboardOpen]);

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      let cancelled = false;
      let unlisteners: Array<() => void> | undefined;

      KeyboardInset.addListener("keyboardInsetChange", (data) => {
         if (data.height !== 0) setLastKeyboardHeight(data.height);
         setIsKeyboardOpen(data.isShowing);
      }).then((listener) => {
         if (cancelled) listener.remove();
         else unlisteners = [...(unlisteners || []), () => listener.remove()];
      });

      return () => {
         cancelled = true;
         unlisteners?.forEach((unlisten) => unlisten());
      };
   }, []);

   return (
      <KeyboardContext.Provider value={{ isKeyboardOpen, lastKeyboardHeight, shouldResizeWindow }}>
         <div style={{ height: shouldResizeWindow && isKeyboardOpen ? `calc(100% - ${lastKeyboardHeight}px)` : "100%" }}>{props.children}</div>
      </KeyboardContext.Provider>
   );
}

// Elements that trigger the native keyboard on Android
function willOpenKeyboard(el: Element | null): boolean {
   if (!el) return false;
   const tag = el.role || el.tagName.toLowerCase();
   if (tag === "textarea" || tag === "textbox") return true;
   if (tag === "input") {
      const type = (el as HTMLInputElement).type?.toLowerCase();
      // These input types do NOT open a keyboard
      const nonKeyboardTypes = new Set(["button", "checkbox", "color", "file", "image", "radio", "range", "reset", "submit"]);
      return !nonKeyboardTypes.has(type);
   }
   return (el as HTMLElement).isContentEditable;
}

export function useKeyboard() {
   return useContext(KeyboardContext);
}
