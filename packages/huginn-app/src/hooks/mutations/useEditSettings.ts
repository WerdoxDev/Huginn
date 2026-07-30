import type { APIPatchUserSettingsJSONBody } from "@huginnjs/shared";

import { useClient } from "@stores/clientStore";
import { useMutation } from "@tanstack/react-query";

export function useEditSettings() {
   const client = useClient();

   const mutation = useMutation({
      mutationKey: ["edit-settings"],
      async mutationFn(settings: APIPatchUserSettingsJSONBody) {
         await client?.users.editSettings(settings);
      },
   });

   return mutation;
}
