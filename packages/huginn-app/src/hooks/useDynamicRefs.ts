const map = new Map<string, React.RefObject<unknown>>();

function setRef<T>(key: string): React.RefObject<T> {
	const ref = createRef<T>();
	map.set(key, ref);
	return ref;
}

function getRef<T>(key: string): React.RefObject<T> | undefined {
	return map.get(key) as React.RefObject<T>;
}

function removeRef(key: string): boolean {
	return map.delete(key);
}

export function useDynamicRefs<T>(): [
	(key: string) => undefined | React.RefObject<T>,
	(key: string) => React.RefObject<T>,
	(key: string) => boolean,
] {
	return [getRef, setRef, removeRef];
}
