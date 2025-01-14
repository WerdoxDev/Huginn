import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";
import { RelationshipType } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";

export async function clientLoader() {
	return await queryClient.ensureQueryData(getRelationshipsOptions(client));
}

const tabs = ["Online", "All", "Pending"];

export default function Component() {
	const client = useClient();
	const { data: friends } = useSuspenseQuery(getRelationshipsOptions(client));

	const allFriends = useMemo(() => friends?.filter((x) => x.type === RelationshipType.FRIEND), [friends]);
	const { presences } = usePresences(allFriends?.map((x) => x.user.id) ?? []);
	const onlineFriends = useMemo(
		() => friends?.filter((x) => x.type === RelationshipType.FRIEND && presences.some((y) => y.user.id === x.user.id && y.status === "online")),
		[allFriends, presences],
	);

	return (
		<div className="flex h-full flex-col">
			<TabGroup as={Fragment} defaultIndex={friends.length === 0 ? 3 : 0}>
				<div className="flex h-[4.75rem] flex-shrink-0 items-center bg-tertiary px-6">
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
									className={`rounded-md px-2 outline-none ${
										selected
											? "pointer-events-none bg-primary text-text"
											: "text-text ring-1 ring-primary hover:bg-primary hover:text-text hover:ring-0"
									}`}
								>
									Add Friend
								</button>
							)}
						</Tab>
					</TabList>
				</div>
				<div className="h-0.5 flex-shrink-0 bg-white/10" />
				<TabPanels className="h-full p-5">
					<FriendsTab friends={onlineFriends} presences={presences} text="Online" />
					<FriendsTab friends={allFriends} presences={presences} text="All Friends" />
					<PendingFriendsTab friends={friends} />
					<AddFriendTab />
				</TabPanels>
			</TabGroup>
			<div className="flex h-16 w-full flex-shrink-0 bg-background" />
		</div>
	);
}
