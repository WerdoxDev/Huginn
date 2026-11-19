import type { APIExpression, GatewayExpressionUpdatedData } from "@huginnjs/shared";

import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

export default function ExpressionsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const { user } = useThisUser();
   const queryClient = useQueryClient();

   useEffect(() => {
      if (!user) return;

      return client?.gateway.listen("expression_update", ({ kind, expression }: GatewayExpressionUpdatedData) => {
         queryClient.setQueryData<APIExpression[]>(["expressions", user.id, kind], (current) => {
            // An unloaded collection must still fetch its complete list when first used.
            if (!current) return current;

            const updated = current.filter((item) => item.id !== expression.id || item.type !== expression.type);
            updated.unshift(expression);
            return updated.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0) || (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""));
         });
      });
   }, [client, queryClient, user?.id]);

   return props.children;
}
