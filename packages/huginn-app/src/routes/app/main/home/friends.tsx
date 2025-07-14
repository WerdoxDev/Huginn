import AddFriendTab from "@components/friends/AddFriendTab";
import FriendsTab from "@components/friends/FriendsTab";
import FriendsTabItem from "@components/friends/FriendsTabItem";
import PendingFriendsTab from "@components/friends/PendingFriendsTab";
import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";
import { RelationshipType } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { client, useClient } from "@stores/apiStore";
import { usePresences } from "@stores/presenceStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { queryClient } from "@/main";

export async function clientLoader() {
	if (!client) {
		return;
	}

	return await queryClient.ensureQueryData(getRelationshipsOptions(client));
}

const tabs = ["Online", "All", "Pending"];

export default function Friends() {
	const client = useClient();
	const { data: friends } = useSuspenseQuery(getRelationshipsOptions(client));

	const allFriends = useMemo(() => friends?.filter((x) => x.type === RelationshipType.FRIEND), [friends]);
	const { presences } = usePresences(allFriends?.map((x) => x.userId) ?? []);
	const onlineFriends = useMemo(
		() => friends?.filter((x) => x.type === RelationshipType.FRIEND && presences.some((y) => y.user.id === x.userId && y.status === "online")),
		[allFriends, presences],
	);

	return (
		<div className="flex h-full flex-col">
			<TabGroup as={Fragment} defaultIndex={friends.length === 0 ? 3 : 0}>
				<div className="flex h-19 shrink-0 items-center bg-surface-deep px-6">
					<TabList className="mr-5 flex justify-center gap-x-5">
						<div className="flex items-center justify-center gap-x-2.5 text-text">
							<IconMingcuteGroup2Fill className="size-6" />
							<span className="font-bold text-lg">Friends</span>
						</div>

						{tabs.map((tab) => (
							<FriendsTabItem key={tab}>{tab}</FriendsTabItem>
						))}

						<Tab as={Fragment}>
							{({ selected }) => (
								<button
									type="button"
									className={clsx(
										"cursor-pointer rounded-md px-2 outline-hidden",
										selected
											? "pointer-events-none bg-primary-700 text-text"
											: "text-text ring-1 ring-primary-700 hover:bg-primary-700 hover:text-text hover:ring-0",
									)}
								>
									Add Friend
								</button>
							)}
						</Tab>
					</TabList>
				</div>
				<div className="h-0.5 shrink-0 bg-white/10" />
				<TabPanels className="h-full overflow-y-scroll p-5">
					<FriendsTab friends={onlineFriends} presences={presences} text="Online" />
					<FriendsTab friends={allFriends} presences={presences} text="All Friends" />
					<PendingFriendsTab friends={friends} />
					<AddFriendTab />
				</TabPanels>
			</TabGroup>
			<div className="flex h-16 w-full shrink-0 bg-surface" />
		</div>
	);
}
