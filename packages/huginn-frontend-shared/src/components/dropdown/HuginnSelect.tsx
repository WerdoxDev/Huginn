import { Drawer, Select } from "@base-ui/react";
import clsx from "clsx";
import { createContext, type CSSProperties, type ReactNode, useCallback, useContext, useEffect, useId, useState } from "react";

import type { HuginnSelectItem } from "../../types";

import useMediaQuery from "../../hooks/useMediaQuery";
import HuginnLabel from "../HuginnLabel";
import { HuginnDrawerBackdrop, HuginnDrawerPopup, type HuginnOverlayLayerController } from "../overlay/HuginnDrawer";

const SelectContext = createContext<{
   id: string;
   isMobile: boolean;
   isDrawerOpen: boolean;
   disabled: boolean;
   hideMobileBackdrop: boolean;
   mobileBottomInset?: CSSProperties["bottom"];
   setIsDrawerOpen: (open: boolean) => void;
}>(undefined!);

export type HuginnSelectProps<T = string> = {
   children?: ReactNode;
   className?: string;
   selected?: HuginnSelectItem<T>;
   disabled?: boolean;
   onChange?: (value: HuginnSelectItem<T>) => void;
   mobile?: boolean;
   mobileOpen?: boolean;
   onMobileOpenChange?: (open: boolean) => void;
   mobileBottomInset?: CSSProperties["bottom"];
   hideMobileBackdrop?: boolean;
   layerController?: HuginnOverlayLayerController;
};

export default function HuginnSelect<T = string>({
   children,
   className,
   disabled,
   hideMobileBackdrop = false,
   layerController,
   mobile,
   mobileBottomInset,
   mobileOpen,
   onChange,
   onMobileOpenChange,
   selected,
}: HuginnSelectProps<T>) {
   const id = useId();
   const viewportIsMobile = useMediaQuery("(max-width: 1023px)");
   const isMobile = mobile ?? viewportIsMobile;
   const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
   const isDrawerOpen = mobileOpen ?? internalDrawerOpen;

   const setIsDrawerOpen = useCallback(
      (open: boolean) => {
         if (mobileOpen === undefined) setInternalDrawerOpen(open);
         onMobileOpenChange?.(open);
      },
      [mobileOpen, onMobileOpenChange],
   );

   useEffect(() => {
      if (!isMobile || !isDrawerOpen || !layerController) return;
      layerController.register(id, () => setIsDrawerOpen(false));
      return () => layerController.unregister(id);
   }, [id, isDrawerOpen, isMobile, layerController, setIsDrawerOpen]);

   function handleValueChange(value: HuginnSelectItem<T> | null) {
      if (!value) return;
      onChange?.(value);
      if (isMobile) setIsDrawerOpen(false);
   }

   return (
      <SelectContext.Provider
         value={{
            id,
            isMobile,
            isDrawerOpen,
            setIsDrawerOpen,
            disabled: disabled ?? false,
            hideMobileBackdrop,
            mobileBottomInset,
         }}
      >
         <Select.Root
            id={id}
            modal={false}
            disabled={disabled}
            value={selected ?? null}
            onValueChange={handleValueChange}
            itemToStringLabel={(item) => item.text}
            itemToStringValue={(item) => String(item.value)}
            isItemEqualToValue={(item, value) => Object.is(item.value, value.value)}
            onOpenChange={isMobile ? () => {} : undefined}
         >
            <div className={clsx("flex flex-col", className)}>{children}</div>
         </Select.Root>
      </SelectContext.Provider>
   );
}

function ChevronIcon({ className }: { className?: string }) {
   return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
         <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   );
}

function CheckIcon({ className }: { className?: string }) {
   return (
      <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
         <path d="m5 12 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
   );
}

function List({
   ariaLabel,
   children,
   className,
   hideArrow,
   hideValue,
   onClick,
   placeholder,
   startIcon,
   triggerClassName,
}: {
   ariaLabel?: string;
   className?: string;
   children?: ReactNode;
   hideValue?: boolean;
   onClick?: () => void;
   placeholder?: string;
   hideArrow?: boolean;
   startIcon?: ReactNode;
   triggerClassName?: string;
}) {
   const context = useContext(SelectContext);

   return (
      <div className={clsx("bg-surface-alt w-full overflow-hidden rounded-lg lg:w-52", className)}>
         <Select.Trigger
            aria-label={ariaLabel}
            onClick={() => {
               onClick?.();
               if (context.isMobile) context.setIsDrawerOpen(true);
            }}
            className={clsx(
               "relative flex h-10 w-full items-center gap-x-1.5 p-2 text-white outline-hidden select-none",
               context.disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
               triggerClassName,
            )}
         >
            {startIcon}
            {!hideValue ? (
               <Select.Value className="flex shrink items-center gap-x-2 overflow-hidden" placeholder={placeholder} render={<div />}>
                  {(value?: HuginnSelectItem) =>
                     value ? (
                        <>
                           {value.icon}
                           {value.text ? <span className="truncate">{value.text}</span> : null}
                        </>
                     ) : (
                        <span className="text-text/60">{placeholder}</span>
                     )
                  }
               </Select.Value>
            ) : null}
            {!hideArrow ? (
               <Select.Icon
                  className={(state) => clsx("ml-auto flex size-6 shrink-0 items-center justify-center transition-transform", state.open && "rotate-180")}
               >
                  <ChevronIcon className="text-primary-500 size-6" />
               </Select.Icon>
            ) : null}
         </Select.Trigger>
         {children}
      </div>
   );
}

function ItemsWrapper({
   align,
   alignOffset = 0,
   children,
   className,
   side,
   sideOffset = 4,
}: {
   className?: string;
   children?: ReactNode;
   side?: Select.Positioner.Props["side"];
   align?: Select.Positioner.Props["align"];
   sideOffset?: Select.Positioner.Props["sideOffset"];
   alignOffset?: Select.Positioner.Props["alignOffset"];
}) {
   const context = useContext(SelectContext);

   if (context.isMobile) {
      return (
         <Drawer.Root open={context.isDrawerOpen} onOpenChange={setOpenFromDrawer(context.setIsDrawerOpen)}>
            <Drawer.Portal>
               {!context.hideMobileBackdrop ? <HuginnDrawerBackdrop bottomInset={context.mobileBottomInset} forceRender /> : null}
               <HuginnDrawerPopup bottomInset={context.mobileBottomInset}>
                  <div className={clsx("flex flex-col overflow-y-auto", className)}>{children}</div>
               </HuginnDrawerPopup>
            </Drawer.Portal>
         </Drawer.Root>
      );
   }

   return (
      <Select.Portal>
         <Select.Positioner
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            collisionPadding={{ top: 28, bottom: 4, left: 4, right: 4 }}
            alignItemWithTrigger={false}
            className="z-20"
            style={{ width: "var(--anchor-width)" }}
         >
            <Select.Popup
               className={clsx(
                  "bg-surface-alt outline-primary-800 overflow-y-auto rounded-lg outline transition-[opacity_transform_blur] duration-200 data-ending-style:translate-y-5 data-ending-style:opacity-0 data-ending-style:blur-sm data-starting-style:translate-y-5 data-starting-style:opacity-0 data-starting-style:blur-sm",
                  className,
               )}
               style={{ maxHeight: "min(var(--available-height), 100vh)" }}
            >
               <Select.List className="flex flex-col">{children}</Select.List>
            </Select.Popup>
         </Select.Positioner>
      </Select.Portal>
   );
}

function setOpenFromDrawer(setOpen: (open: boolean) => void) {
   return (open: boolean) => setOpen(open);
}

function Item<T = string>({
   children,
   className,
   disabled,
   hideSelected,
   item,
}: {
   item: HuginnSelectItem<T>;
   children?: ReactNode;
   hideSelected?: boolean;
   className?: string;
   disabled?: boolean;
}) {
   const context = useContext(SelectContext);
   const itemClass = clsx(
      "group data-highlighted:bg-surface active:bg-surface flex cursor-pointer items-center gap-x-2 px-2 py-2 text-white/70 outline-none",
      context.isMobile ? "rounded-md px-3 py-3" : "data-selected:bg-surface/50 data-selected:text-white",
      "data-disabled:cursor-not-allowed data-disabled:opacity-50",
      className,
   );

   return (
      <Select.Item value={item} disabled={disabled} className={itemClass} onClick={context.isMobile ? () => context.setIsDrawerOpen(false) : undefined}>
         {item.icon}
         {item.text ? <Select.ItemText className="wrap-anywhere">{item.text}</Select.ItemText> : null}
         {children}
         {!hideSelected ? (
            <Select.ItemIndicator
               keepMounted
               className={(state) =>
                  clsx("text-primary-500 ml-auto flex size-5 shrink-0 items-center justify-center transition-opacity", !state.selected && "opacity-0")
               }
            >
               <CheckIcon className="size-5" />
            </Select.ItemIndicator>
         ) : null}
      </Select.Item>
   );
}

function Label({ children }: { children?: ReactNode }) {
   const context = useContext(SelectContext);
   return <HuginnLabel htmlFor={context.id}>{children}</HuginnLabel>;
}

HuginnSelect.Label = Label;
HuginnSelect.List = List;
HuginnSelect.ItemsWrapper = ItemsWrapper;
HuginnSelect.Item = Item;
