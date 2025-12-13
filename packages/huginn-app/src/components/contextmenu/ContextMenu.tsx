import {
   autoUpdate,
   FloatingFocusManager,
   FloatingList,
   FloatingNode,
   FloatingPortal,
   FloatingTree,
   flip,
   offset,
   safePolygon,
   shift,
   useDismiss,
   useFloating,
   useFloatingNodeId,
   useFloatingParentNodeId,
   useFloatingTree,
   useHover,
   useInteractions,
   useListItem,
   useListNavigation,
   useMergeRefs,
   useRole,
   size,
} from "@floating-ui/react";
import { omit } from "@huginn/shared";
import clsx from "clsx";
import { createContext, type HTMLProps, type RefObject, Suspense, useContext, useEffect, useRef, useState } from "react";
import type { ContextMenuItemProps, ContextMenuProps } from "@/types";

const Context = createContext<{
   getItemProps: (userProps?: React.HTMLProps<HTMLElement>) => Record<string, unknown>;
   activeIndex: number | null;
   setActiveIndex: React.Dispatch<React.SetStateAction<number | null>>;
   setHasFocusInside: React.Dispatch<React.SetStateAction<boolean>>;
   isOpen: boolean;
}>({
   getItemProps: () => ({}),
   activeIndex: null,
   setActiveIndex: () => {},
   setHasFocusInside: () => {},
   isOpen: false,
});

function Menu(props: ContextMenuProps & HTMLProps<HTMLButtonElement>) {
   const [isOpen, _setIsOpen] = useState(false);
   const [hasFocusInside, setHasFocusInside] = useState(false);
   const [activeIndex, setActiveIndex] = useState<number | null>(null);

   const elementsRef = useRef<(HTMLButtonElement | null)[]>([]);
   const labelsRef = useRef<(string | null)[]>([]);
   const parent = useContext(Context);

   const tree = useFloatingTree();
   const nodeId = useFloatingNodeId();
   const parentId = useFloatingParentNodeId();
   const item = useListItem();

   const isNested = parentId != null;

   const { floatingStyles, refs, context } = useFloating<HTMLButtonElement>({
      nodeId,
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: isNested ? "right-start" : "bottom-start",
      middleware: [
         offset({ mainAxis: isNested ? 12 : 0, alignmentAxis: 0 }),
         flip(),
         shift({ padding: 10 }),
         size({
            apply({ availableWidth, availableHeight, elements }) {
               Object.assign(elements.floating.style, {
                  maxWidth: `${Math.max(0, availableWidth)}px`,
                  maxHeight: `${Math.max(0, availableHeight)}px`,
               });
            },
            padding: 5,
         }),
      ],
      whileElementsMounted: autoUpdate,
   });

   const hover = useHover(context, {
      enabled: isNested,
      delay: { open: 75 },
      handleClose: safePolygon({ blockPointerEvents: true }),
   });
   const role = useRole(context, { role: "menu" });
   const dismiss = useDismiss(context, { bubbles: true });
   const listNavigation = useListNavigation(context, {
      listRef: elementsRef,
      activeIndex,
      nested: isNested,
      onNavigate: setActiveIndex,
   });

   const mergedRefs = useMergeRefs([refs.setReference, item.ref, props.ref]);

   const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([hover, role, dismiss, listNavigation]);

   function setIsOpen(isOpen: boolean) {
      _setIsOpen(isOpen);
      if (!isOpen && props.close) props.close();
   }

   useEffect(() => {
      if (isNested) return;
      if (!props.isOpen) return;

      setIsOpen(true);

      refs.setPositionReference({
         getBoundingClientRect() {
            return {
               width: 0,
               height: 0,
               x: props.position?.[0] ?? 0,
               y: props.position?.[1] ?? 0,
               top: props.position?.[1] ?? 0,
               right: props.position?.[0] ?? 0,
               bottom: props.position?.[1] ?? 0,
               left: props.position?.[0] ?? 0,
            };
         },
      });
   }, [props.isOpen]);

   // Event emitter allows you to communicate across tree components.
   // This effect closes all menus when an item gets clicked anywhere
   // in the tree.
   useEffect(() => {
      if (!tree) return;

      function handleTreeClick() {
         setIsOpen(false);
      }

      function onSubMenuOpen(event: { nodeId: string; parentId: string }) {
         if (event.nodeId !== nodeId && event.parentId === parentId) {
            setIsOpen(false);
         }
      }

      tree.events.on("click", handleTreeClick);
      tree.events.on("menuopen", onSubMenuOpen);

      return () => {
         tree.events.off("click", handleTreeClick);
         tree.events.off("menuopen", onSubMenuOpen);
      };
   }, [tree, nodeId, parentId]);

   useEffect(() => {
      if (isOpen && tree) {
         tree.events.emit("menuopen", { parentId, nodeId });
      }
   }, [tree, isOpen, nodeId, parentId]);

   return (
      <FloatingNode id={nodeId}>
         {isNested && (
            <button
               ref={mergedRefs}
               tabIndex={parent.activeIndex === item.index ? 0 : -1}
               role="menuitem"
               data-open={isOpen ? "" : undefined}
               data-focus-inside={hasFocusInside ? "" : undefined}
               className="rounded-xs outline-hidden focus:bg-primary-700 px-2 py-1 text-start text-sm text-white/90"
               {...getReferenceProps(
                  parent.getItemProps({
                     ...props,
                     onFocus(event: React.FocusEvent<HTMLButtonElement>) {
                        props.onFocus?.(event);
                        setHasFocusInside(false);
                        parent.setHasFocusInside(true);
                     },
                  }),
               )}
            >
               {props.label}
               <span aria-hidden style={{ marginLeft: 10, fontSize: 10 }}>
                  ▶
               </span>
            </button>
         )}
         <Context.Provider
            value={{
               activeIndex,
               setActiveIndex,
               getItemProps,
               setHasFocusInside,
               isOpen,
            }}
         >
            <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
               {isOpen && (
                  <FloatingPortal root={props.parent ? props.parent : undefined}>
                     <Suspense>
                        <FloatingFocusManager context={context} modal={false} initialFocus={isNested ? -1 : 0} returnFocus={!isNested}>
                           <div
                              ref={refs.setFloating}
                              className="outline-hidden z-998 scroll-surface scroll-super-thin flex min-w-28 flex-col overflow-y-scroll rounded-lg bg-zinc-900 p-2 pr-0 shadow-lg"
                              style={floatingStyles}
                              {...getFloatingProps()}
                           >
                              {props.renderChildren ?? props.children}
                           </div>
                        </FloatingFocusManager>
                     </Suspense>
                  </FloatingPortal>
               )}
            </FloatingList>
         </Context.Provider>
      </FloatingNode>
   );
}

function Item(props: ContextMenuItemProps & React.ButtonHTMLAttributes<HTMLButtonElement> & { ref?: RefObject<HTMLButtonElement> }) {
   const menu = useContext(Context);
   const item = useListItem({ label: props.disabled ? null : props.label });
   const tree = useFloatingTree();
   const isActive = item.index === menu.activeIndex;

   return (
      <button
         {...omit(props, ["preventClose"])}
         ref={useMergeRefs([item.ref, props.ref])}
         type="button"
         role="menuitem"
         className={clsx(
            "outline-hidden flex shrink-0 cursor-pointer items-center justify-between gap-x-5 text-nowrap rounded-sm px-2 py-2 text-start text-sm disabled:cursor-not-allowed",
            !props.color || props.color === "default"
               ? "focus:bg-surface-alt text-white/90 disabled:text-white/50"
               : props.color === "negative" && "text-negative-100 focus:bg-negative-100/10 disabled:text-negative-100/50",
            props.className,
         )}
         tabIndex={isActive ? 0 : -1}
         disabled={props.disabled}
         {...menu.getItemProps({
            onClick(event: React.MouseEvent<HTMLButtonElement>) {
               props.onClick?.(event);

               if (!props.preventClose) {
                  tree?.events.emit("click");
               }
            },
            onFocus(event: React.FocusEvent<HTMLButtonElement>) {
               props.onFocus?.(event);
               menu.setHasFocusInside(true);
            },
         })}
      >
         {props.label}
         {props.children}
      </button>
   );
}

export default function ContextMenu(props: ContextMenuProps) {
   const parentId = useFloatingParentNodeId();

   if (parentId === null) {
      return (
         <FloatingTree>
            <Menu {...props} />
         </FloatingTree>
      );
   }

   return <Menu {...props} />;
}

function Divider() {
   return <div className="bg-surface mx-1 my-2 h-px shrink-0" />;
}

ContextMenu.Item = Item;
ContextMenu.Divider = Divider;

// export function ContextMenu(){

// }

// <ContextMenu>
//    <ContextMenu.Button>
//       BUTTON
//    </ContextMenu.Button>
//
//    <ContextMenu.Menu>
//       <ContextMenu.Item>
//          ITEM 1
//       </ContextMenu.Item>
//
//       <ContextMenu.Menu>
//          <ContextMenu.Item>
//             ITEM 1
//          </ContextMenu.Item>
//       </ContextMenu.Menu>
//    </ContextMenu.Menu>
// </ContextMenu>
