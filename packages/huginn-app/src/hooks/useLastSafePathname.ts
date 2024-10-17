import { routeHistory } from "@contexts/historyContext.ts";
import { useLocation, useNavigate } from "@tanstack/react-router";

export function useSafePathname() {
	const navigate = useNavigate();
	const location = useLocation();

	async function navigateBack() {
		const safePathname = routeHistory.lastPathname?.includes(location.pathname) ? "/channels/@me" : routeHistory.lastPathname;
		await navigate({ to: safePathname });
	}

	return { navigateBack };
}
