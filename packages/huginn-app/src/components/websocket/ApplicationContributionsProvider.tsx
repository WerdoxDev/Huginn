import type {
   APIGetUserContributionsResult,
   GatewayApplicationContributionAddData,
   GatewayApplicationContributionUpdateData,
} from "@huginnjs/shared";

import { useClient } from "@stores/clientStore";
import { updateApplicationCatalog } from "@stores/storageStore";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

const queryKey = ["application-contributions", "@me"] as const;

export default function ApplicationContributionsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();

   function onContributionAdded(contribution: GatewayApplicationContributionAddData) {
      queryClient.setQueryData<APIGetUserContributionsResult>(queryKey, (current) => {
         if (!current) return current;
         if (current.some((item) => item.id === contribution.id)) {
            return current.map((item) => (item.id === contribution.id ? contribution : item));
         }
         return [contribution, ...current];
      });
   }

   async function onContributionUpdated(contribution: GatewayApplicationContributionUpdateData) {
      queryClient.setQueryData<APIGetUserContributionsResult>(queryKey, (current) =>
         current?.map((item) => (item.id === contribution.id ? contribution : item)),
      );

      await updateApplicationCatalog();
   }

   useEffect(() => {
      const unlistenAdd = client?.gateway.listen("application_contribution_add", onContributionAdded);
      const unlistenUpdate = client?.gateway.listen("application_contribution_update", onContributionUpdated);

      return () => {
         unlistenAdd?.();
         unlistenUpdate?.();
      };
   }, [client, queryClient]);

   return props.children;
}
