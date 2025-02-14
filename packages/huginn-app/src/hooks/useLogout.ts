import { useClient } from "@contexts/apiContext";
import { useChannelStore } from "@stores/channelStore";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useHuginnMutation } from "./useHuginnMutation";

export function useLogout() {
	const queryClient = useQueryClient();
	const client = useClient();
	const navigate = useNavigate();
	const { resetScrolls } = useChannelStore();

	const mutation = useHuginnMutation({
		async mutationFn() {
			await client.logout();
			client.gateway.connect();
		},
	});

	async function logout() {
		localStorage.removeItem("refresh-token");
		localStorage.removeItem("access-token");

		await navigate(`/login?${new URLSearchParams({ force: "1" }).toString()}`, { replace: true, viewTransition: true });
		await mutation.mutateAsync();

		resetScrolls();
		queryClient.removeQueries({ queryKey: ["channels"] });
		queryClient.removeQueries({ queryKey: ["messages"] });
		queryClient.removeQueries({ queryKey: ["relationships"] });
	}

	return logout;
}
