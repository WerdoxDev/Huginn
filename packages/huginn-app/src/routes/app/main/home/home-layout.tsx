import { queryClient } from "@/root";
import HomeSidebar from "@components/HomeSidebar";
import UserInfo from "@components/UserInfo";
import { getChannelsOptions } from "@lib/queries";
import { client, useClient } from "@stores/apiStore";
import { useThisUser } from "@stores/userStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet } from "react-router";

export async function clientLoader() {
	return await queryClient.ensureQueryData(getChannelsOptions(client, "@me"));
}

export default function Layout() {
	const client = useClient();
	const { data } = useSuspenseQuery(getChannelsOptions(client, "@me"));

	const { user } = useThisUser();

	return (
		//TODO: Abstract the 2 (navigation & content) parts to a central component for later use
		<div className="flex h-full w-full flex-col overflow-hidden">
			<div className="flex h-full">
				<div className="flex w-64 flex-shrink-0 flex-col">
					<HomeSidebar channels={data} />
					{user && <UserInfo user={user} />}
				</div>
				<div className="relative w-full overflow-hidden bg-tertiary">
					<Outlet />
				</div>
			</div>
		</div>
	);
}
