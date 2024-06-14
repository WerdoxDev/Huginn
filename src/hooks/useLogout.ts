import { useClient } from "@contexts/apiContext";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";

export function useLogout() {
   const queryClient = useQueryClient();
   const router = useRouter();
   const client = useClient();
   const navigate = useNavigate();

   async function logout(shouldNavigate: boolean) {
      localStorage.removeItem("refresh-token");
      localStorage.removeItem("access-token");
      await client.logout();

      if (!shouldNavigate) return;

      await navigate({ to: "/login" });
      queryClient.removeQueries({ queryKey: ["channels"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      queryClient.removeQueries({ queryKey: ["relationships"] });
   }

   return logout;
}
