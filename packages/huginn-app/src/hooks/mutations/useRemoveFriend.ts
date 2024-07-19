import { useClient } from "@contexts/apiContext";
import { useMutation } from "@tanstack/react-query";

export function useRemoveFriend() {
   const client = useClient();

   const mutation = useMutation({
      async mutationFn(userId: string) {
         await client.relationships.delete(userId);
      },
   });

   return mutation;
}
