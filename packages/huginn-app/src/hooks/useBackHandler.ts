import { useEffect, useEffectEvent } from "react";

import { registerBackHandler, unregisterBackHandler } from "./useBackButtonManager";

export function useBackHandler(id: string, priority: number, handler: () => boolean | void) {
   const ourHandler = useEffectEvent(() => handler());

   useEffect(() => {
      registerBackHandler(id, priority, ourHandler);
      return () => unregisterBackHandler(id);
   }, [id, priority]);
}
