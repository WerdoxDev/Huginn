import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { Tooltip } from "@components/tooltip/Tooltip";
import { usePresences } from "@contexts/presenceContext";
import { useUser } from "@contexts/userContext";
import { Transition } from "@headlessui/react";
import type { APIChannelUser, Snowflake } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";

export default function RecipientsSidebar(props: { recipients: APIChannelUser[]; ownerId: Snowflake; visible: boolean }) {
	const { getPresence } = usePresences(props.recipients.map((x) => x.id));
	const { user } = useUser();

	const recipients = useMemo<APIChannelUser[]>(
		() => [user as APIChannelUser, ...props.recipients].toSorted((a, b) => (a.username > b.username ? 1 : -1)),
		[user, props.recipients],
	);
	return (
		<Transition show={props.visible}>
			<div className="group relative my-2 w-56 flex-shrink-0 transition-all duration-200 data-[closed]:w-0 data-[closed]:scale-90 data-[closed]:opacity-0">
				<div className="absolute flex h-full w-[13.5rem] flex-col gap-y-2 rounded-xl bg-secondary p-2 shadow-lg ring-2 ring-primary/70 transition-all duration-700 group-data-[closed]:ring-0">
					<div className="mt-1 ml-2 text-text/70 text-xs uppercase">Members - {recipients.length}</div>
					<div className="flex flex-col gap-y-0.5 ">
						{recipients.map((x) => {
							const presence = getPresence(x.id);

							return (
								<div
									key={x.id}
									className="group/recipient flex items-center gap-x-3 rounded-lg p-1.5 hover:cursor-pointer hover:bg-background"
								>
									<UserAvatarWithStatus
										userId={x.id}
										avatarHash={x.avatar}
										className={clsx(
											(!presence || presence?.status === "offline") && x.id !== user?.id && "opacity-30",
											"group-hover/recipient:opacity-100",
										)}
									/>
									<div
										className={clsx(
											presence?.status === "online" || x.id === user?.id ? "text-text/70" : "text-text/30",
											"group-hover/recipient:text-text/100",
										)}
									>
										{x.username}
									</div>
									{x.id === props.ownerId && (
										<Tooltip>
											<Tooltip.Trigger className="mr-2 ml-auto text-success">
												<IconMingcuteShieldShapeLine />
											</Tooltip.Trigger>
											<Tooltip.Content>Channel Owner</Tooltip.Content>
										</Tooltip>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</Transition>
	);
}
