import { useClient } from "@contexts/apiContext";
import type { Snowflake } from "@huginn/shared";
import { getChannelIcon, getUserAvatar } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";

export default function ChannelIcon(props: {
	channelId: Snowflake;
	iconHash?: string | null;
	size?: string;
	className?: string;
}) {
	const client = useClient();

	const { data: avatar } = useQuery(getChannelIcon(props.channelId, props.iconHash, client));

	const [hasErrors, setHasErrors] = useState(false);

	useEffect(() => {
		setHasErrors(false);
	}, [avatar]);

	const { size = "2.25rem", className } = props;
	return (
		<div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
			{avatar && !hasErrors ? (
				<img alt="channel-icon" src={avatar} onError={() => setHasErrors(true)} className="h-full w-full rounded-full object-cover" />
			) : !hasErrors && !avatar ? (
				<div className="h-full w-full rounded-full bg-primary" />
			) : (
				<div className="flex h-full w-full items-center justify-center rounded-full bg-error/50 font-bold text-text">!</div>
			)}
		</div>
	);
}
