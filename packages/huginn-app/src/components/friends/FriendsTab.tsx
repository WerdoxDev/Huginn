import type { AppRelationship } from "@/types";
import { TabPanel } from "@headlessui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useLookup } from "@hooks/useLookup";
import type { APIPublicUser, Snowflake, UserPresence } from "@huginn/shared";
import { useEffect, useMemo } from "react";
import FriendItem from "./FriendItem";

export default function FriendsTab(props: { friends: AppRelationship[] | null; presences: UserPresence[]; text: string }) {
	const mutation = useCreateDMChannel("create-dm-channel_other");

	const users = useUsers(props.friends?.map((x) => x.userId));
	const userLookup = useLookup(users, (user) => user.id);
	const presenceLookup = useLookup(props.presences, (presence) => presence.user.id);

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
						presence={presenceLookup[friend.userId]}
						user={userLookup[friend.userId]}
						key={friend.id}
						type={friend.type}
					/>
				))}
			</div>
		</TabPanel>
	);
}
