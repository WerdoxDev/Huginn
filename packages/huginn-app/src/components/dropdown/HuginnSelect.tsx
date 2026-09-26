import { useInset } from "@contexts/InsetContext";
import { popStackHandler, pushStackHandler } from "@hooks/useBackButtonManager";
import { useIsMobile } from "@hooks/useIsMobile";
import { HuginnSelect as SharedHuginnSelect, type HuginnOverlayLayerController, type HuginnSelectProps } from "@huginn/frontend-shared";
import { usePopovers } from "@stores/popoverStore";

const layerController: HuginnOverlayLayerController = {
   register: pushStackHandler,
   unregister: popStackHandler,
};

export default function HuginnSelect<T = string>(props: HuginnSelectProps<T>) {
   const isMobile = useIsMobile();
   const popovers = usePopovers();
   const { isKeyboardOpen, lastKeyboardHeight, lastNavBarHeight, shouldResizeWindow } = useInset();
   const bottomInset = shouldResizeWindow && isKeyboardOpen ? lastKeyboardHeight + lastNavBarHeight : lastNavBarHeight;
   const isAnyPopoverOpen = Object.values(popovers).some((popover) => popover && "isOpen" in popover && popover.isOpen);

   return (
      <SharedHuginnSelect
         {...props}
         mobile={props.mobile ?? isMobile}
         mobileBottomInset={props.mobileBottomInset ?? bottomInset}
         hideMobileBackdrop={props.hideMobileBackdrop ?? isAnyPopoverOpen}
         layerController={props.layerController ?? layerController}
      />
   );
}

HuginnSelect.Label = SharedHuginnSelect.Label;
HuginnSelect.List = SharedHuginnSelect.List;
HuginnSelect.ItemsWrapper = SharedHuginnSelect.ItemsWrapper;
HuginnSelect.Item = SharedHuginnSelect.Item;
