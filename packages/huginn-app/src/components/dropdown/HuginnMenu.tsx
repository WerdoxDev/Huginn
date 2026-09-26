import { useInset } from "@contexts/InsetContext";
import { popStackHandler, pushStackHandler } from "@hooks/useBackButtonManager";
import { useIsMobile } from "@hooks/useIsMobile";
import { HuginnMenu as SharedHuginnMenu, type HuginnMenuProps, type HuginnOverlayLayerController } from "@huginn/frontend-shared";

const layerController: HuginnOverlayLayerController = {
   register: pushStackHandler,
   unregister: popStackHandler,
};

export function HuginnMenu(props: HuginnMenuProps) {
   const isMobile = useIsMobile();
   const { isKeyboardOpen, lastKeyboardHeight, lastNavBarHeight, shouldResizeWindow } = useInset();
   const bottomInset = shouldResizeWindow && isKeyboardOpen ? lastKeyboardHeight + lastNavBarHeight : lastNavBarHeight;

   return (
      <SharedHuginnMenu
         {...props}
         mobile={props.mobile ?? isMobile}
         mobileBottomInset={props.mobileBottomInset ?? bottomInset}
         layerController={props.layerController ?? layerController}
      />
   );
}

HuginnMenu.Trigger = SharedHuginnMenu.Trigger;
HuginnMenu.Content = SharedHuginnMenu.Content;
HuginnMenu.Item = SharedHuginnMenu.Item;
HuginnMenu.Separator = SharedHuginnMenu.Separator;
HuginnMenu.SubmenuRoot = SharedHuginnMenu.SubmenuRoot;
HuginnMenu.SubmenuTrigger = SharedHuginnMenu.SubmenuTrigger;
HuginnMenu.Submenu = SharedHuginnMenu.Submenu;
