import type { Snowflake } from "@huginn/shared";
import { apiStore } from "@stores/apiStore";
import { useMemo } from "react";
import { useStore } from "zustand";

export function useUser(id: Snowflake) {
	const thisStore = useStore(apiStore);
	return useMemo(() => thisStore.users.find((x) => x.id === id), [thisStore.users, id]);
}

export function useUsers(ids?: Snowflake[]) {
	const thisStore = useStore(apiStore);
	// console.log(ids);
	return useMemo(() => thisStore.users.filter((x) => ids?.includes(x.id)), [thisStore.users, ids]);
}
