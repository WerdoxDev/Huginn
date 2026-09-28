import { createContext, useContext } from "react";

import type { StaffSession } from "../types";

export const StaffSessionContext = createContext<StaffSession | undefined>(undefined);

export function useStaffSession() {
   const session = useContext(StaffSessionContext);
   if (!session) throw new Error("useStaffSession must be used inside StaffLayout");
   return session;
}
