import type { Snowflake } from "@huginn/shared";
import { getChannelIconOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState } from "react";
import LoadingIcon from "./LoadingIcon";

export default function ChannelIcon(props: { channelId: Snowflake; iconHash?: string | null; size?: string; className?: string }) {
	const client = useClient();
	const { data: icon, isLoading } = useQuery(getChannelIconOptions(props.channelId, props.iconHash, client));

	const [hasErrors, setHasErrors] = useState(true);

	useEffect(() => {
		setHasErrors(false);
	}, [icon]);

	const { size = "2.25rem", className } = props;
	return (
		<div className={clsx("relative shrink-0", className)} style={{ width: size, height: size }}>
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary-900">
					<LoadingIcon className="size-5" />
				</div>
			)}
			{icon && !hasErrors ? (
				<img alt="channel-icon" src={icon} onError={() => setHasErrors(true)} className="h-full w-full rounded-full object-cover" />
			) : !hasErrors && !icon && !isLoading ? (
				<div className="h-full w-full rounded-full bg-primary-700" />
			) : (
				hasErrors && <div className="flex h-full w-full items-center justify-center rounded-full bg-negative-400 font-bold text-text">!</div>
			)}
		</div>
	);
}
