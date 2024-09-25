import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export default function useRouteAnimation(...updateFor: string[]) {
	const router = useRouter();
	const [id, setId] = useState<string>();

	useEffect(() => {
		findAndSetId();

		const unsubscribe = router.subscribe("onResolved", ({ pathChanged }) => {
			if (!pathChanged) return;

			findAndSetId();
		});

		return () => {
			unsubscribe();
		};
	}, []);

	function findAndSetId() {
		setId(router.state.matches.find((x) => x.id === "/_layoutAnimation/_layoutAuth" || x.id === "/_layoutAnimation/_layoutMain")?.id ?? "");
	}

	return { id, updateFor };
}
