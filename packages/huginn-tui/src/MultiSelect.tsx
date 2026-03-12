import { BoxRenderable, TextAttributes, type BoxOptions, type RenderContext } from "@opentui/core";
import { extend, useKeyboard, useRenderer } from "@opentui/react";
import { useEffect, useMemo, useRef, useState } from "react";

export class MultiSelectRenderable extends BoxRenderable {
   protected override _focusable = true;
   constructor(ctx: RenderContext, options: BoxOptions & { focused?: boolean }) {
      super(ctx, options);

      if (options.focused) {
         this._focused = options.focused;
      }
   }
}

extend({ multiselect: MultiSelectRenderable });

export function MultiSelect(props: {
   label: string;
   options: Record<string, string[]>;
   focused?: boolean;
   style?: {
      focusedTextColor?: string;
      focusedHintTextColor?: string;
      selectedIndicatorColor?: string;
      selectedTextColor?: string;
   };
   onChange?: (selected: Record<string, string[]>) => void;
}) {
   const [isOpen, setIsOpen] = useState(false);
   const [selected, setSelected] = useState<Record<string, string[]>>({});
   const [focusedPath, setFocusedPath] = useState<{ option: number; sub: number | null }>({
      option: 0,
      sub: null,
   });
   const [expandedOption, setExpandedOption] = useState<string | undefined>(undefined);
   const root = useRef<MultiSelectRenderable | null>(null);

   const keys = Object.keys(props.options);

   // const focused = useMemo(() => renderer.currentFocusedRenderable === root.current, [renderer.currentFocusedRenderable]);
   const toggleOption = (option: string) => {
      setExpandedOption((prev) => {
         if (props.options[option]![0] === "") return prev;
         // const next = new Set(prev);
         // next.clear();
         // if (next.has(option)) {
         //    next.delete(option);
         // } else {
         //    next.add(option);
         // }
         return prev === option ? undefined : option;
      });
   };

   const toggleSelection = (option: string, suboption?: string) => {
      setSelected((prev) => {
         const next = { ...prev };
         if (suboption) {
            const current = next[option] || [];
            if (current.includes(suboption)) {
               next[option] = current.filter((s) => s !== suboption);
               if (next[option].length === 0) delete next[option];
            } else {
               next[option] = [...current, suboption];
            }
         } else {
            if (next[option]) {
               delete next[option];
            } else {
               next[option] = [...props.options[option]!];
            }
         }
         return next;
      });
   };

   const getDisplayItems = () => {
      const items: Array<{ type: "option" | "sub"; option: string; sub?: string }> = [];
      keys.forEach((option) => {
         items.push({ type: "option", option: option });
         if (expandedOption === option) {
            props.options[option]!.forEach((sub) => {
               items.push({ type: "sub", option: option, sub });
            });
         }
      });
      return items;
   };

   const getSelectedText = () => {
      const parts: string[] = [];
      Object.entries(selected).forEach(([option, subs]) => {
         if (subs.length === props.options[option]!.length) {
            parts.push(option);
         } else {
            subs.forEach((sub) => parts.push(`${option}>${sub}`));
         }
      });
      return parts.length > 0 ? parts.join("\n") : "Empty selection";
   };

   useEffect(() => {
      if (!props.focused) {
         setIsOpen(false);
      }
   }, [props.focused]);

   useEffect(() => {
      props.onChange?.(selected);
   }, [selected]);

   useKeyboard((key) => {
      if (!props.focused) return;

      if (!isOpen) {
         if (key.name === "return") {
            setIsOpen(true);
         }
         return;
      }

      const items = getDisplayItems();
      const currentIndex = items.findIndex(
         (item) =>
            item.option === keys[focusedPath.option] &&
            (focusedPath.sub === null ? item.type === "option" : item.sub === props.options[keys[focusedPath.option]!]![focusedPath.sub]),
      );

      switch (key.name) {
         case "up": {
            const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            const newItem = items[newIndex]!;
            setFocusedPath({
               option: keys.indexOf(newItem.option),
               sub: newItem.type === "sub" ? props.options[newItem.option]!.indexOf(newItem.sub!) : null,
            });
            break;
         }
         case "down": {
            const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            const newItem = items[newIndex]!;
            setFocusedPath({
               option: keys.indexOf(newItem.option),
               sub: newItem.type === "sub" ? props.options[newItem.option]!.indexOf(newItem.sub!) : null,
            });
            break;
         }
         case "right": {
            const option = keys[focusedPath.option]!;
            if (focusedPath.sub === null && props.options[option]!.length > 0) {
               if (expandedOption !== option) {
                  toggleOption(option);
               }
            }
            break;
         }
         case "left": {
            const option = keys[focusedPath.option]!;
            if (focusedPath.sub === null && expandedOption === option) {
               toggleOption(option);
            } else if (focusedPath.sub !== null) {
               setFocusedPath({ option: focusedPath.option, sub: null });
            }
            break;
         }
         case "space": {
            const option = keys[focusedPath.option]!;
            if (focusedPath.sub === null) {
               toggleSelection(option);
            } else {
               const sub = props.options[option]![focusedPath.sub];
               toggleSelection(option, sub);
            }
            break;
         }
         case "return":
            setIsOpen(false);
            break;
         case "escape":
            setIsOpen(false);
            break;
      }
   });

   return (
      <multiselect style={{ flexDirection: "column", overflow: "hidden" }} ref={root} focused={props.focused} id={props.label}>
         <box style={{ flexDirection: "row", columnGap: 1 }}>
            <text
               style={{
                  attributes: TextAttributes.BOLD,
                  fg: props.focused ? props.style?.focusedTextColor : undefined,
               }}
            >
               {props.label}:
            </text>
            {props.focused && <text style={{ fg: props.style?.focusedHintTextColor }}>(press Enter to select)</text>}
         </box>
         <box style={{ width: 50, padding: 0 }}>
            {!isOpen ? (
               <text
                  style={{
                     marginLeft: 2,
                     fg: props.focused ? props.style?.focusedHintTextColor : "gray",
                     attributes: props.focused ? TextAttributes.ITALIC : undefined,
                  }}
               >
                  {getSelectedText()}
               </text>
            ) : (
               <box
                  style={{
                     border: true,
                     borderStyle: "rounded",
                     borderColor: props.style?.focusedTextColor,
                  }}
               >
                  {getDisplayItems().map((item, idx) => {
                     const isFocused =
                        item.option === keys[focusedPath.option] &&
                        (focusedPath.sub === null ? item.type === "option" : item.sub === props.options[keys[focusedPath.option]!]![focusedPath.sub]);

                     const isSelected =
                        item.type === "option"
                           ? selected[item.option]?.length === props.options[item.option]!.length && props.options[item.option]!.length > 0
                           : selected[item.option]?.includes(item.sub!);

                     const isPartiallySelected =
                        item.type === "option" &&
                        selected[item.option] &&
                        selected[item.option]?.length !== 0 &&
                        selected[item.option]?.length !== props.options[item.option]!.length &&
                        props.options[item.option]!.length > 0;

                     const isExpanded = item.type === "option" && expandedOption === item.option;
                     const isExpandable = props.options[item.option]![0] !== "";

                     return (
                        <box key={idx} style={{ flexDirection: "row", columnGap: 0 }}>
                           <text style={{ fg: props.style?.focusedTextColor }}>{isFocused ? ">" : " "}</text>
                           <text>{item.type === "sub" ? "  " : ""}</text>
                           <box style={{ flexDirection: "row" }}>
                              <text>[</text>
                              <text style={{ fg: props.style?.selectedIndicatorColor }}>{isSelected ? "x" : isPartiallySelected ? "-" : " "}</text>
                              <text>]</text>
                           </box>
                           <text
                              style={{
                                 fg: isSelected ? props.style?.selectedTextColor : undefined,
                              }}
                           >
                              {" "}
                              {item.type === "sub" ? item.sub : item.option}
                           </text>
                           {isExpandable && (
                              <text style={{ fg: "white" }}>
                                 {" "}
                                 {item.type === "option" && props.options[item.option]!.length > 0 ? (isExpanded ? "▼" : "▶") : ""}
                              </text>
                           )}
                        </box>
                     );
                  })}
               </box>
            )}
         </box>
         {/* <text style={{ fg: props.focused ? props.style?.focusedTextColor : undefined, marginTop: isOpen ? 1 : 0 }}>{props.label}: </text>
         <box style={{ width: 35 }}>
            {!isOpen ? (
               <text
                  style={{
                     fg: props.focused ? props.style?.focusedHintTextColor : "gray",
                     attributes: props.props.focused ? TextAttributes.ITALIC : undefined,
                  }}
               >
                  {selected.length > 0 ? selected.join("\n") : props.focused ? "(press Enter to select)" : "Empty"}
               </text>
            ) : (
               <box style={{ border: true, borderColor: "gray", borderStyle: "rounded" }}>
                  {props.options.map((option, index) => (
                     <box key={option} style={{ flexDirection: "row", columnGap: 1 }}>
                        <text style={{ fg: props.style?.focusedTextColor }}>{focusedIndex === index ? ">" : " "}</text>
                        <box style={{ flexDirection: "row" }}>
                           <text>[</text>
                           <text style={{ fg: props.style?.selectedIndicatorColor }}>{selected.includes(option) ? "x" : " "}</text>
                           <text>]</text>
                        </box>
                        <text style={{ fg: selected.includes(option) ? props.style?.selectedTextColor : undefined }}>{option}</text>
                     </box>
                  ))}
               </box>
            )}
         </box> */}
      </multiselect>
   );
}

export default MultiSelect;
