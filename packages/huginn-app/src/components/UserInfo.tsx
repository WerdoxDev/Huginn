import { useLogout } from "@hooks/useLogout";
import type { APIUser } from "@huginn/shared";
import { useModals } from "@stores/modalsStore";
import { useMutation } from "@tanstack/react-query";
import DropdownMenu from "./dropdown/DowndownMenu";
import Tooltip from "./tooltip/Tooltip";
import UserAvatar from "./UserAvatar";

export default function UserInfo(props: { user: APIUser }) {
	const { updateModals } = useModals();
	const logout = useLogout();

	const mutation = useMutation({
		async mutationFn() {
			await logout();
		},
	});

	function openSettings(e: React.MouseEvent) {
		e.stopPropagation();
		updateModals({ settings: { isOpen: true } });
	}

	return (
		<div className="flex h-16 w-64 shrink-0 items-center">
			<DropdownMenu className="flex w-full items-center justify-center">
				<DropdownMenu.Button as="div" className="group flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white/5">
					<UserAvatar userId={props.user.id} avatarHash={props.user.avatar} className="mr-3 shrink-0" />

					<div className="flex w-full flex-col items-start gap-y-0.5">
						<div className="text-sm text-text">{props.user.displayName ?? props.user.username}</div>
						<div className="text-text/70 text-xs">Online</div>
					</div>
					<div className="flex shrink-0 gap-x-1">
						<Tooltip>
							<Tooltip.Trigger
								className="group/setting rounded-lg p-1 hover:bg-surface"
								onClick={openSettings}
								onMouseDown={(e) => e.stopPropagation()}
							>
								<IconMingcuteSettings5Fill className="size-6 text-white/80 transition-all group-hover/setting:rotate-60" />
							</Tooltip.Trigger>
							<Tooltip.Content>User Settings</Tooltip.Content>
						</Tooltip>
					</div>
				</DropdownMenu.Button>

				<DropdownMenu.Items className="w-60 [--anchor-gap:8px]" anchor="top">
					<DropdownMenu.Item
						label="Logout"
						className="!text-negative-100 hover:!bg-negative-100/10 py-2"
						onClick={() => {
							mutation.mutate();
						}}
					>
						<IconMingcuteExitFill className="size-5" />
					</DropdownMenu.Item>
					<DropdownMenu.Divider />
					<DropdownMenu.Item onClick={() => navigator.clipboard.writeText(props.user.id)} label="Copy User ID" className="py-2">
						<IconMingcuteIdcardFill className="size-5" />
					</DropdownMenu.Item>
				</DropdownMenu.Items>
			</DropdownMenu>
		</div>
	);
}
