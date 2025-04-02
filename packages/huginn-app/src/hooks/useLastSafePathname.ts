import { useHistory } from "@contexts/historyContext";
import { useLocation, useNavigate } from "react-router";

export function useSafePathname() {
	const navigate = useNavigate();
	const location = useLocation();
	const history = useHistory();

	async function navigateBack() {
		const safePathname = history.lastPathname?.includes(location.pathname) ? "/channels/@me" : history.lastPathname;

		console.log("NAV");
		await navigate(safePathname ?? "/");
	}

	return { navigateBack };
}
