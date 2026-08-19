import { useEffect, useEffectEvent } from "react";

import { registerBackHandler, unregisterBackHandler } from "./useBackButtonManager";

export enum BackHandlerId {
   LeftSidebar = 20,
   RightSidebar = 30,
   CallOverlay = 40,
   MessageBox = 100,
}

export function useBackHandler(id: BackHandlerId, handler: () => boolean | void, placement: "after-stack" | "before-stack" = "after-stack") {
   const ourHandler = useEffectEvent(() => handler());

   useEffect(() => {
      const handlerId = BackHandlerId[id];
      registerBackHandler(handlerId, id, placement, ourHandler);
      return () => unregisterBackHandler(handlerId);
   }, [id, placement]);
}
