import { useEffect, useEffectEvent } from "react";

import { pushStackHandler, popStackHandler } from "./useBackButtonManager";

export function useStackBackHandler(id: string, onBack: () => void, isOpen: boolean) {
   const handler = useEffectEvent(() => onBack());

   useEffect(() => {
      if (!isOpen) return;

      pushStackHandler(id, handler);
      return () => popStackHandler(id);
   }, [isOpen]);
}
