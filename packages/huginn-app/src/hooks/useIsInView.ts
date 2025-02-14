import { useEffect, useMemo, useState, type RefObject } from "react";

export function useIsInView(ref: RefObject<HTMLElement | null>) {
	const [isInView, setIsInView] = useState(false);

	const observer = useMemo(() => new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting)), [ref]);

	useEffect(() => {
		if (ref.current) {
			observer.observe(ref.current);
		}

		return () => observer.disconnect();
	}, []);

	return isInView;
}
