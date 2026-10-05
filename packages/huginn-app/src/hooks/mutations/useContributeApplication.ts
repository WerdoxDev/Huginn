import type { APIPostApplicationCatalogJSONBody } from "@huginnjs/shared";

import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export function useContributeApplication() {
   const client = useClient();
   const mutation = useMutation({
      mutationKey: ["contribute-application"],
      async mutationFn(data: APIPostApplicationCatalogJSONBody) {
         return await client?.applications.contribute(data);
      },
   });

   return mutation;
}
