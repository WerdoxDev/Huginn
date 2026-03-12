import HuginnCheckbox from "@components/HuginnCheckbox";
import Tooltip from "@components/tooltip/Tooltip";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

import type { KeybindType } from "@/types";

const keybindsTexts: Record<KeybindType, string> = {
   toggle_deafen: "Toggle Deafen",
   toggle_mute: "Toggle Mute",
};

export default function SettingsKeybindsTab() {
   const keybinds = useStorage("keybinds");
   const { setValue } = useStorageStore();

   const sortedKeybinds = useMemo(() => keybinds.toSorted((a, b) => a.type.localeCompare(b.type)), [keybinds]);

   async function onChange(type: KeybindType, combination: string[], isEnabled: boolean) {
      await setValue("keybinds", [...keybinds.filter((x) => x.type !== type), { type, combination, isEnabled }]);
   }

   useEffect(() => {
      window.electronAPI.setKeybindsEnabled(false);

      return () => {
         window.electronAPI.setKeybindsEnabled(true);
      };
   });

   return (
      <div className="flex flex-col">
         <div className="flex w-sm flex-col gap-y-2">
            {sortedKeybinds.map((x) => (
               <KeybindDisplay
                  key={x.type}
                  type={x.type}
                  text={keybindsTexts[x.type]}
                  combination={x.combination}
                  isEnabled={x.isEnabled}
                  onChange={onChange}
               />
            ))}
         </div>
         <div className="text-text mt-2 text-xs font-medium italic opacity-70 select-none">*Keybinds are disabled while you are in this page</div>
      </div>
   );
}

function KeybindDisplay(props: {
   type: KeybindType;
   text: string;
   combination: string[];
   isEnabled: boolean;
   onChange: (type: KeybindType, combination: string[], isEnabled: boolean) => void;
}) {
   const [displayCombination, setDisplayCombination] = useState("");
   const [isEditing, setIsEditing] = useState(false);
   const { updateModals } = useModals();

   useEffect(() => {
      updateModals({ settings: { isClosable: !isEditing } });

      if (!isEditing) {
         return;
      }

      setDisplayCombination("");

      const pressedKeys = new Set<string>();
      const controller = new AbortController();
      let mainKey: string | undefined;

      function normalizeKey(key: string) {
         if (key.length === 1) return key.toUpperCase();
         const map: Record<string, string> = {
            Control: "Ctrl",
            Shift: "Shift",
            Alt: "Alt",
            Meta: "Meta",
         };
         return map[key] ?? key;
      }

      function isModifier(key: string) {
         return ["Control", "Shift", "Alt", "Meta"].includes(key);
      }

      window.addEventListener(
         "keydown",
         (e) => {
            e.preventDefault();

            const normalized = normalizeKey(e.key);

            if (normalized === "Escape") {
               setIsEditing(false);
               props.onChange(props.type, [], props.isEnabled);
               return;
            }

            if (isModifier(e.key)) {
               pressedKeys.add(normalized);
            } else {
               mainKey = normalized;
            }

            const combination = [...pressedKeys];
            if (mainKey) combination.push(mainKey);
            setDisplayCombination(combination.join(" + "));
         },
         { signal: controller.signal },
      );

      window.addEventListener(
         "keyup",
         (_e) => {
            if (!mainKey) {
               setIsEditing(false);
               return;
            }

            const combination = [...pressedKeys, mainKey];

            if (combination.length === 0) return;

            props.onChange?.(props.type, combination, props.isEnabled);
            setIsEditing(false);

            pressedKeys.clear();
         },
         { signal: controller.signal },
      );

      return () => {
         controller.abort();
      };
   }, [isEditing]);

   return (
      <div className="bg-surface-alt flex w-full items-center rounded-lg px-3 py-3">
         <div className="font-semibold text-white">{props.text}</div>
         <div className="ml-auto">
            {!isEditing ? (
               <Tooltip>
                  <Tooltip.Content>Click to edit</Tooltip.Content>
                  <Tooltip.Trigger className="flex gap-x-1" onClick={() => setIsEditing(true)}>
                     <div
                        className={clsx(
                           "bg-surface rounded-md border border-b-2 border-white/50 px-2 py-1 text-white",
                           props.combination.length === 0 ? "text-white/70" : "text-white",
                        )}
                     >
                        {props.combination.length === 0 ? "Unassigned" : props.combination.join(" + ")}
                     </div>
                  </Tooltip.Trigger>
               </Tooltip>
            ) : (
               <div className="flex gap-x-2">
                  <div className="border-negative-300 bg-surface-deep rounded-md border border-b-2 px-2 py-1 text-white/50">
                     {displayCombination === "" ? "Listening for input..." : displayCombination}
                  </div>
               </div>
            )}
         </div>
         <Tooltip>
            <Tooltip.Content>Enable or disable this keybind</Tooltip.Content>
            <Tooltip.Trigger>
               <HuginnCheckbox
                  className="ml-3"
                  checked={props.isEnabled}
                  onChange={() => props.onChange(props.type, props.combination, !props.isEnabled)}
               >
                  <HuginnCheckbox.Toggle />
               </HuginnCheckbox>
            </Tooltip.Trigger>
         </Tooltip>
      </div>
   );
}
