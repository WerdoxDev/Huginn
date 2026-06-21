import { useEffect, useEffectEvent } from "react";

import { registerBackHandler, unregisterBackHandler } from "./useBackButtonManager";

export function useBackHandler(
   id: string,
   priority: number,
   handler: () => boolean | void,
   placement: "after-stack" | "before-stack" = "after-stack",
) {
   const ourHandler = useEffectEvent(() => handler());

   useEffect(() => {
      registerBackHandler(id, priority, placement, ourHandler);
      return () => unregisterBackHandler(id);
   }, [id, priority, placement]);
}
