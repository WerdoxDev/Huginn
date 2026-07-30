import type { Snowflake } from "@huginn/shared";

import { getUserOptions, getUserProfileOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";

export function useUser(id: Snowflake) {
   const client = useClient();
   const { data } = useSuspenseQuery(getUserOptions(client!, id));
   return data;
}

export function useMaybeUser(id?: Snowflake) {
   const client = useClient();
   const { data } = useQuery({ ...getUserOptions(client!, id ?? "0"), enabled: false });
   return data;
}

export function useUsers(ids?: Snowflake[]) {
   const client = useClient();
   const queries = useSuspenseQueries({
      queries: ids?.map((x) => getUserOptions(client!, x)) ?? [],
   });

   const users = queries.map((x) => x.data);
   return users;
}

export function useUserProfile(id: Snowflake) {
   const client = useClient();
   const { data } = useSuspenseQuery(getUserProfileOptions(client!, id));
   return data;
}
