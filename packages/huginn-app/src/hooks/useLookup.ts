import { useMemo } from "react";

export function useLookup<T, K extends string | number>(items: T[] | undefined, keyFn: (item: T) => K): Record<K, T> {
	return useMemo(
		() =>
			(items ?? []).reduce(
				(acc, item) => {
					acc[keyFn(item)] = item;
					return acc;
				},
				{} as Record<K, T>,
			),
		[items],
	);
}
