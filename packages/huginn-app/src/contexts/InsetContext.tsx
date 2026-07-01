import { useCapacitorListener } from "@hooks/useCapacitorListener";
import Inset from "@lib/capacitor/inset-plugin";
import { useHuginnWindow } from "@stores/windowStore";
import { createContext, useContext, useEffect, useEffectEvent, useRef, useState, type ReactNode, type RefObject } from "react";

const InsetContext = createContext<{
   isKeyboardOpen: boolean;
   lastKeyboardHeight: number;
   lastNavBarHeight: number;
   shouldResizeWindow: boolean;
   focusedElementRef?: RefObject<Element | null>;
}>({
   isKeyboardOpen: false,
   lastKeyboardHeight: 0,
   lastNavBarHeight: 0,
   shouldResizeWindow: true,
});

const elementSuppressesResize = (el: Element | null) =>
   el?.hasAttribute("data-keyboard-no-resize") || el?.closest("[data-keyboard-no-resize]") !== null;

export function InsetProvider(props: { children: ReactNode }) {
   const huginnWindow = useHuginnWindow();

   const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
   const [lastKeyboardHeight, setLastKeyboardHeight] = useState(Number(localStorage.getItem("cached-keyboard-height")) || 0);
   const [lastNavBarHeight, setLastNavBarHeight] = useState(Number(localStorage.getItem("cached-navBar-height")) || 0);
   const [shouldResizeWindow, setShouldResizeWindow] = useState(true);
   const [isFocusedElementInRoot, setIsFocusedElementInRoot] = useState(false);
   const focusedElementRef = useRef<Element | null>(null);

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      if (lastKeyboardHeight === 0 || lastNavBarHeight === 0) {
         Inset.show();
      }
   }, []);

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      const abortController = new AbortController();

      window.addEventListener(
         "focusin",
         (e) => {
            const target = e.target as Element;
            focusedElementRef.current = target;

            setIsFocusedElementInRoot(!!target.closest("[data-keyboard-root]"));

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

   const handleInsetChange = useEffectEvent((data: { keyboardHeight: number; navBarHeight: number; isShowing: boolean }) => {
      if (data.keyboardHeight !== 0) {
         const height = data.keyboardHeight - data.navBarHeight;
         setLastKeyboardHeight(height);
         localStorage.setItem("cached-keyboard-height", height.toString());
      }

      if (data.navBarHeight !== 0) {
         setLastNavBarHeight(data.navBarHeight);
         localStorage.setItem("cached-navBar-height", data.navBarHeight.toString());
      }

      // if we never had a keyboard or navbar height, this open call is from the initial show so hide it again
      if ((lastKeyboardHeight === 0 && data.keyboardHeight !== 0) || (lastNavBarHeight === 0 && data.navBarHeight !== 0)) {
         Inset.hide();
         return;
      }

      setIsKeyboardOpen(data.isShowing);
   });

   useCapacitorListener(() => Inset.addListener("insetChange", handleInsetChange));

   return (
      <InsetContext.Provider value={{ isKeyboardOpen, lastKeyboardHeight, shouldResizeWindow, lastNavBarHeight, focusedElementRef }}>
         <div
            className="relative isolate"
            data-keyboard-root
            style={{
               height:
                  shouldResizeWindow && isFocusedElementInRoot && isKeyboardOpen
                     ? `calc(100% - ${lastKeyboardHeight}px - ${lastNavBarHeight}px)`
                     : `calc(100% - ${lastNavBarHeight}px)`,
            }}
         >
            {props.children}
         </div>
         <div className="bg-surface fixed right-0 bottom-0 left-0 z-999" style={{ height: lastNavBarHeight }} />
      </InsetContext.Provider>
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

export function useInset() {
   return useContext(InsetContext);
}
