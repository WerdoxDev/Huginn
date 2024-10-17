import UserAvatarWithStatus from "@components/UserAvatarWithStatus.tsx";
import { ComboboxInput } from "@components/input/ComboboxInput.tsx";
import HuginnInput from "@components/input/HuginnInput.tsx";
import { Checkbox } from "@headlessui/react";
import { type APIRelationUser, type APIRelationshipWithoutOwner, RelationshipType, type Snowflake } from "@huginn/shared";
import { useMemo, useState } from "react";

export default function AddRecipientInput(props: {
	label?: string;
	relationships?: APIRelationshipWithoutOwner[];
	onSelectionChanged?: (values: APIRelationUser[]) => void;
}) {
	const [query, setQuery] = useState("");

	const [selectedUsers, setSelectedUsers] = useState<Snowflake[]>([]);
	const selectedUsersDisplay = useMemo(
		() => props.relationships?.filter((x) => selectedUsers.includes(x.user.id)).map((x) => x.user),
		[props.relationships, selectedUsers],
	);

	const filteredUsers = useMemo(
		() =>
			props.relationships?.filter(
				(x) => x.type === RelationshipType.FRIEND && (query ? x.user.displayName?.includes(query) || x.user.username.includes(query) : true),
			),
		[query, props.relationships],
	);

	function selectionChanged(values: Snowflake[]) {
		setSelectedUsers(values);
		props.onSelectionChanged?.(props.relationships?.filter((x) => values.includes(x.user.id)).map((x) => x.user) ?? []);
	}

	return (
		<ComboboxInput
			onSelectionChange={selectionChanged}
			selection={selectedUsers}
			status={{ code: "none", text: "" }}
			onChange={(e) => setQuery(e.value)}
		>
			<HuginnInput.Label className="mb-2" text={props.label ?? "Members"} />
			<HuginnInput.Wrapper border="left" className="!items-start flex-col">
				<ComboboxInput.SelectionDisplay>
					{({ toggleSelection }) => (
						<div className="mx-2 mt-2 flex select-none flex-wrap gap-1">
							{selectedUsersDisplay?.map((user) => (
								<button type="button" onClick={() => toggleSelection(user.id)} key={user.id} className="rounded-sm bg-primary px-2 text-text">
									{user.displayName ?? user.username}
								</button>
							))}
						</div>
					)}
				</ComboboxInput.SelectionDisplay>
				<HuginnInput.Input className="w-full" />
			</HuginnInput.Wrapper>
			<ComboboxInput.OptionWrapper>
				{query && filteredUsers?.length === 0 ? (
					<div className="flex h-full w-full items-center justify-center text-text">No friends matched your search!</div>
				) : (
					filteredUsers?.length === 0 && (
						<div className="flex h-full w-full items-center justify-center text-text">You don't have any eligible friends!</div>
					)
				)}
				{filteredUsers?.map((x) => (
					<ComboboxInput.Option value={x.user.id} key={x.user.id}>
						<UserAvatarWithStatus userId={x.user.id} avatarHash={x.user.avatar} />
						<div className="text-text text-nowrap text-ellipsis overflow-hidden">{x.user.displayName ?? x.user.username}</div>
						<div className="text-sm text-text/70">{x.user.username}</div>
						<Checkbox
							checked={selectedUsers?.includes(x.user.id) ?? false}
							className="ml-auto size-6 shrink-0 rounded-md border border-accent data-[checked]:bg-accent "
						/>
					</ComboboxInput.Option>
				))}
			</ComboboxInput.OptionWrapper>
		</ComboboxInput>
	);
}
