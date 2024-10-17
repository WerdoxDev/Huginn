import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

export function useLogout() {
	const queryClient = useQueryClient();
	const client = useClient();
	const navigate = useNavigate();

	const mutation = useHuginnMutation({
		async mutationFn() {
			await client.logout();
		},
	});

	async function logout(shouldNavigate: boolean) {
		localStorage.removeItem("refresh-token");
		localStorage.removeItem("access-token");
		await mutation.mutateAsync();

		if (!shouldNavigate) return;

		await navigate({ to: "/login", replace: true });
		queryClient.removeQueries({ queryKey: ["channels"] });
		queryClient.removeQueries({ queryKey: ["messages"] });
		queryClient.removeQueries({ queryKey: ["relationships"] });
	}

	return logout;
}
