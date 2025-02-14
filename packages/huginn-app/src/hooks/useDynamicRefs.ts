import { createRef, type RefObject } from "react";

const map = new Map<string, RefObject<unknown>>();

function setRef<T>(key: string): RefObject<T | null> {
	const ref = createRef<T>();
	map.set(key, ref);
	return ref;
}

function getRef<T>(key: string): RefObject<T> | undefined {
	return map.get(key) as RefObject<T>;
}

function removeRef(key: string): boolean {
	return map.delete(key);
}

export function useDynamicRefs<T>(): {
	getRef: (key: string) => undefined | RefObject<T>;
	setRef: (key: string) => RefObject<T | null>;
	removeRef: (key: string) => boolean;
} {
	return { getRef, setRef, removeRef };
}
