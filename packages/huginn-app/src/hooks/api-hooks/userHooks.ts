import type { Snowflake } from "@huginn/shared";
import { getUserOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";

export function useUser(id?: Snowflake) {
   const client = useClient();
   const { data } = useSuspenseQuery(getUserOptions(client!, id));
   return data;
}

export function useUsers(ids?: Snowflake[]) {
   const client = useClient();
   const queries = useSuspenseQueries({ queries: ids?.map((x) => getUserOptions(client!, x)) ?? [] });

   const users = queries.map((x) => x.data);
   return users;
}
