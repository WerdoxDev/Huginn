import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";

export function useLogout() {
	const queryClient = useQueryClient();
	const client = useClient();
	const navigate = useNavigate();

	const mutation = useHuginnMutation({
		async mutationFn() {
			await client.logout();
			client.gateway.connect();
		},
	});

	async function logout() {
		localStorage.removeItem("refresh-token");
		localStorage.removeItem("access-token");
		mutation.mutate();

		await navigate("/login", { replace: true, viewTransition: true });

		queryClient.removeQueries({ queryKey: ["channels"] });
		queryClient.removeQueries({ queryKey: ["messages"] });
		queryClient.removeQueries({ queryKey: ["relationships"] });
	}

	return logout;
}
