import { useHistory } from "@contexts/HistoryContext";
import { useLocation, useNavigate } from "@tanstack/react-router";

export function useSafePathname() {
   const navigate = useNavigate();
   const location = useLocation();
   const history = useHistory();

   async function navigateBack() {
      const safePathname = history.lastPathname?.includes(location.pathname) ? "/channels/@me" : history.lastPathname;

      await navigate({ to: safePathname ?? "/" });
   }

   return { navigateBack };
}
