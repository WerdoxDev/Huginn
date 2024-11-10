import { TabPanel } from "@headlessui/react";
import type { APIRelationshipWithoutOwner, Snowflake, UserPresence } from "@huginn/shared";

export default function FriendsTab(props: { friends: APIRelationshipWithoutOwner[] | null; presences: UserPresence[]; text: string }) {
	const mutation = useCreateDMChannel();

	const amount = useMemo(() => props.friends?.length ?? 0, [props.friends]);

	function onMessage(userId: Snowflake) {
		if (!mutation.isPending) {
			mutation.mutate({ recipients: [userId] });
		}
	}

	return (
		<TabPanel>
			<div className="ml-2.5 font-medium text-text/70 text-xs uppercase">
				{props.text} - {amount}
			</div>
			<div className="mt-5 flex flex-col justify-center gap-y-1">
				{props.friends?.map((friend) => (
					<FriendItem
						onMessage={onMessage}
						presence={props.presences.find((x) => x.user.id === friend.user.id)}
						key={friend.id}
						user={friend.user}
						type={friend.type}
					/>
				))}
			</div>
		</TabPanel>
	);
}
