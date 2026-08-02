import type { Snowflake } from "@huginnjs/shared";

import { getUserOptions, getUserProfileOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useQuery, useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";

export function useUser(id: Snowflake) {
   const { data } = useSuspenseQuery(getUserOptions(id));
   return data;
}

export function useMaybeUser(id?: Snowflake) {
   const { data } = useQuery({ ...getUserOptions(id ?? "0"), enabled: false });
   return data;
}

export function useUsers(ids?: Snowflake[]) {
   const queries = useSuspenseQueries({
      queries: ids?.map((x) => getUserOptions(x)) ?? [],
   });

   const users = queries.map((x) => x.data);
   return users;
}

export function useUserProfile(id: Snowflake) {
   const { data } = useSuspenseQuery(getUserProfileOptions(id));
   return data;
}
