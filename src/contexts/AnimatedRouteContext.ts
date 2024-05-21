/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Router } from "@tanstack/react-router";
import { createContext } from "react";

export const AnimatedRouteContext = createContext<{ context: Router<any, any>; setContext: (router: Router<any, any>) => void }>({
   context: null!,
   setContext: (_router: Router<any, any>) => {},
});
