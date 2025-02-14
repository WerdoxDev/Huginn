import { useClient } from "@contexts/apiContext";
import { usePresence } from "@contexts/presenceContext";
import type { Snowflake } from "@huginn/shared";
import { getUserAvatarOptions } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";
import LoadingIcon from "./LoadingIcon";

export default function UserAvatar(props: {
	userId: Snowflake;
	avatarHash?: string | null;
	size?: string;
	statusSize?: string;
	className?: string;
	hideStatus?: boolean;
}) {
	const client = useClient();
	const { data: avatar, isLoading } = useQuery(getUserAvatarOptions(props.userId, props.avatarHash, client));

	const presence = usePresence(props.userId);
	const [hasErrors, setHasErrors] = useState(false);

	useEffect(() => {
		setHasErrors(false);
	}, [avatar]);

	const { size = "2.25rem", statusSize = "0.75rem", className } = props;
	return (
		<div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20">
					<LoadingIcon className="size-5" />
				</div>
			)}
			{avatar && !hasErrors ? (
				<img alt="user-avatar" src={avatar} onError={() => setHasErrors(true)} className="h-full w-full rounded-full object-cover" />
			) : !hasErrors && !avatar && !isLoading ? (
				<div className="h-full w-full rounded-full bg-primary" />
			) : (
				hasErrors && <div className="flex h-full w-full items-center justify-center rounded-full bg-error/50 font-bold text-text">!</div>
			)}
			{!props.hideStatus && (
				<div
					className={clsx(
						"absolute right-0 bottom-0 rounded-full",
						presence ? (presence.status === "online" ? "bg-success" : "bg-transparent") : "bg-transparent",
					)}
					style={{ width: statusSize, height: statusSize }}
				/>
			)}
		</div>
	);
}
