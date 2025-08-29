import {
   autoUpdate,
   flip,
   FloatingFocusManager,
   FloatingList,
   FloatingNode,
   FloatingTree,
   offset,
   safePolygon,
   shift,
   useClick,
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
   useTypeahead,
   type FloatingContext,
   type Placement,
} from "@floating-ui/react";
import { Portal, Transition } from "@headlessui/react";
import { omit } from "@huginn/shared";
import clsx from "clsx";
import {
   createContext,
   useContext,
   useEffect,
   useRef,
   useState,
   type Dispatch,
   type HTMLProps,
   type ReactNode,
   type SetStateAction,
   type FocusEvent,
   type MouseEvent,
   type RefObject,
   type ReactElement,
} from "react";

const MenuContext = createContext<{
   getItemProps: (userProps?: HTMLProps<HTMLElement>) => Record<string, unknown>;
   activeIndex: number | null;
   setActiveIndex: Dispatch<SetStateAction<number | null>>;
   setHasFocusInside: Dispatch<SetStateAction<boolean>>;
   isOpen: boolean;
   elementsRef: React.MutableRefObject<Array<HTMLButtonElement | null>>;
   labelsRef: React.MutableRefObject<Array<string | null>>;
}>(undefined!);

const DropdownContext = createContext<{
   triggerProps: Record<string, any>;
   floatingProps: Record<string, any>;
   isNested: boolean;
   context: FloatingContext;
}>(undefined!);

type DropdownMenuProps = {
   children?: ReactNode;
   className?: string;
   onOpenChanged?: (isOpen: boolean) => void;
   anchor?: DropdownAnchor;
};

export type DropdownAnchor = { placement: Placement; gap: number };

export function DropdownMenu(props: DropdownMenuProps) {
   const parentId = useFloatingParentNodeId();

   if (parentId !== null) {
      return <Main {...props}>{props.children}</Main>;
   }

   return (
      <FloatingTree>
         <Main {...props}>{props.children}</Main>
      </FloatingTree>
   );
}

function Main(props: DropdownMenuProps) {
   const [isOpen, setIsOpen] = useState(false);
   const [_hasFocusInside, setHasFocusInside] = useState(false);
   const [activeIndex, setActiveIndex] = useState<number | null>(null);

   const elementsRef = useRef<Array<HTMLButtonElement | null>>([]);
   const labelsRef = useRef<Array<string | null>>([]);
   const parent = useContext(MenuContext);

   const tree = useFloatingTree();
   const nodeId = useFloatingNodeId();
   const parentId = useFloatingParentNodeId();
   const item = useListItem();

   const isNested = parentId !== null;

   const { floatingStyles, refs, context } = useFloating<HTMLButtonElement>({
      nodeId,
      open: isOpen,
      onOpenChange: setIsOpen,
      placement: props.anchor?.placement ? props.anchor.placement : isNested ? "right-start" : "bottom-start",
      middleware: [
         offset({ mainAxis: isNested ? 12 : (props.anchor?.gap ?? 4), alignmentAxis: isNested ? -8 : (props.anchor?.gap ?? 0) }),
         flip(),
         shift(),
      ],
      whileElementsMounted: autoUpdate,
   });

   const hover = useHover(context, {
      enabled: isNested,
      delay: { open: 75, close: 100 },
      handleClose: safePolygon({ blockPointerEvents: true }),
   });

   const click = useClick(context, {
      event: "mousedown",
      toggle: !isNested,
      ignoreMouse: isNested,
   });

   const role = useRole(context, { role: "menu" });
   const dismiss = useDismiss(context, { bubbles: true });

   const listNavigation = useListNavigation(context, {
      listRef: elementsRef,
      activeIndex,
      nested: isNested,
      onNavigate: setActiveIndex,
   });

   const typeahead = useTypeahead(context, {
      listRef: labelsRef,
      onMatch: isOpen ? setActiveIndex : undefined,
      activeIndex,
   });

   const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([hover, click, role, dismiss, listNavigation, typeahead]);

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

   useEffect(() => {
      props.onOpenChanged?.(isOpen);
   }, [isOpen]);

   const menuContextValue = {
      activeIndex,
      setActiveIndex,
      getItemProps,
      setHasFocusInside,
      isOpen,
      elementsRef,
      labelsRef,
   };

   const triggerProps = getReferenceProps(
      parent?.getItemProps({
         tabIndex: !isNested ? undefined : parent.activeIndex === item.index ? 0 : -1,
         role: isNested ? "menuitem" : undefined,
         onFocus() {
            setHasFocusInside(false);
            parent.setHasFocusInside(true);
         },
      }),
   );

   const floatingProps = {
      ref: refs.setFloating,
      style: floatingStyles,
      ...getFloatingProps(),
   };

   const dropdownContextValue = {
      triggerProps: {
         ...triggerProps,
         ref: useMergeRefs([refs.setReference, item.ref]),
      },
      floatingProps,
      isNested,
      context,
   };

   return (
      <FloatingNode id={nodeId}>
         <MenuContext.Provider value={menuContextValue}>
            <DropdownContext.Provider value={dropdownContextValue}>
               {isNested ? props.children : <div className={clsx("relative", props.className)}>{props.children}</div>}
            </DropdownContext.Provider>
         </MenuContext.Provider>
      </FloatingNode>
   );
}

function Button(
   props: {
      children?: ReactNode | ((bags: { open: boolean }) => ReactElement);
      className?: string;
      ref?: RefObject<HTMLDivElement>;
   } & Omit<HTMLProps<HTMLDivElement>, "children">,
) {
   const { triggerProps, context } = useContext(DropdownContext);

   return (
      <div
         {...omit(props, ["children"])}
         {...triggerProps}
         ref={useMergeRefs([triggerProps.ref, props.ref])}
         className={clsx(props.className, "cursor-pointer")}
      >
         {typeof props.children === "function" ? props.children({ open: context.open }) : props.children}
      </div>
   );
}

function Items(props: { children?: ReactNode; className?: string }) {
   const menu = useContext(MenuContext);
   const { floatingProps, isNested, context } = useContext(DropdownContext);

   return (
      <Portal>
         <div {...floatingProps} className="z-998 relative outline-none">
            <Transition show={menu.isOpen}>
               <div
                  className={clsx(
                     props.className,
                     "outline-hidden data-closed:scale-95 data-closed:opacity-0 flex min-w-28 flex-col rounded-lg bg-zinc-900 p-2 shadow-lg transition-[opacity,scale]",
                  )}
               >
                  <FloatingList elementsRef={menu.elementsRef} labelsRef={menu.labelsRef}>
                     <FloatingFocusManager context={context} modal={false} initialFocus={isNested ? -1 : 0} returnFocus={!isNested}>
                        {props.children as ReactElement}
                     </FloatingFocusManager>
                  </FloatingList>
               </div>
            </Transition>
         </div>
      </Portal>
   );
}

function Item(props: HTMLProps<HTMLButtonElement> & { label: string; color?: "default" | "negative"; isNested?: boolean }) {
   const menu = useContext(MenuContext);
   const { triggerProps } = useContext(DropdownContext);
   const item = useListItem({
      label: props.disabled ? null : typeof props.children === "string" ? props.children : null,
   });
   const tree = useFloatingTree();
   const isActive = item.index === menu.activeIndex;

   return (
      <button
         {...omit(props, ["isNested"])}
         {...(props.isNested ? triggerProps : undefined)}
         ref={props.isNested ? useMergeRefs([triggerProps.ref, props.ref]) : useMergeRefs([item.ref, props.ref])}
         type="button"
         className={clsx(
            "data-disabled:cursor-not-allowed data-disabled:hover:!bg-transparent flex cursor-pointer items-center justify-between gap-x-5 text-nowrap rounded-sm px-2 py-2 text-start text-sm outline-none",
            !props.color || props.color === "default"
               ? "hover:enabled:bg-surface-alt data-disabled:text-white/50 text-white/90"
               : props.color === "negative" && "text-negative-100 hover:enabled:bg-negative-100/10 data-disabled:text-negative-100/50",
            props.className,
         )}
         tabIndex={isActive ? 0 : -1}
         disabled={props.disabled}
         {...(props.isNested
            ? undefined
            : menu?.getItemProps({
                 onClick(event: MouseEvent<HTMLButtonElement>) {
                    props.onClick?.(event);
                    tree?.events.emit("click");
                 },
                 onFocus(event: FocusEvent<HTMLButtonElement>) {
                    props.onFocus?.(event);
                    menu.setHasFocusInside(true);
                 },
              }))}
      >
         {props.label}
         <div className="flex items-center justify-center gap-x-1">
            {props.children}
            {props.isNested && <IconMingcuteRightLine className="size-5 text-white/80" />}
         </div>
      </button>
   );
}

function Divider() {
   return <div className="bg-surface mx-2 my-2 h-px" />;
}

DropdownMenu.Divider = Divider;
DropdownMenu.Button = Button;
DropdownMenu.Items = Items;
DropdownMenu.Item = Item;
