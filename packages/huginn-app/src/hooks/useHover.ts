import { type DependencyList, type RefObject, useEffect, useRef, useState } from "react";

export function useHover<T extends HTMLElement>(deps?: DependencyList): [RefObject<T | null>, boolean] {
	const ref = useRef<T>(null);
	const [isHovered, setIsHovered] = useState(false);

	useEffect(
		() => {
			console.log(ref.current);
			const node = ref.current;
			if (!node) return;

			const handleMouseEnter = () => setIsHovered(true);
			const handleMouseLeave = () => setIsHovered(false);

			node.addEventListener("mouseenter", handleMouseEnter);
			node.addEventListener("mouseleave", handleMouseLeave);

			return () => {
				node.removeEventListener("mouseenter", handleMouseEnter);
				node.removeEventListener("mouseleave", handleMouseLeave);
			};
		},
		deps ? [...deps] : [],
	);

	return [ref, isHovered];
}
