import { useInset } from "@contexts/InsetContext";
import { popStackHandler, pushStackHandler } from "@hooks/useBackButtonManager";
import { useIsMobile } from "@hooks/useIsMobile";
import { HuginnIconSelect as SharedHuginnIconSelect, type HuginnIconSelectProps, type HuginnOverlayLayerController } from "@huginn/frontend-shared";

const layerController: HuginnOverlayLayerController = {
   register: pushStackHandler,
   unregister: popStackHandler,
};

export default function HuginnIconSelect<T = string>(props: HuginnIconSelectProps<T>) {
   const isMobile = useIsMobile();
   const { isKeyboardOpen, lastKeyboardHeight, lastNavBarHeight, shouldResizeWindow } = useInset();
   const bottomInset = shouldResizeWindow && isKeyboardOpen ? lastKeyboardHeight + lastNavBarHeight : lastNavBarHeight;

   return (
      <SharedHuginnIconSelect
         {...props}
         mobile={props.mobile ?? isMobile}
         mobileBottomInset={props.mobileBottomInset ?? bottomInset}
         layerController={props.layerController ?? layerController}
      />
   );
}
