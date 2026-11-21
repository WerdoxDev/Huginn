import type { ReactNode } from "react";

import { useExpressionUpdates } from "@hooks/useExpressions";

export default function ExpressionsProvider(props: { children?: ReactNode }) {
   useExpressionUpdates();

   return props.children;
}
