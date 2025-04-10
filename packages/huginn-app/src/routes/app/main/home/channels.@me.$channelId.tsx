import { queryClient } from "@/main";
import MessageBox from "@components/MessageBox";
import ChannelMessages from "@components/channels/ChannelMessages";
import DirectChannelCall from "@components/channels/DirectChannelCall";
import HomeTopbar from "@components/channels/HomeTopbar";
import RecipientsSidebar from "@components/channels/RecipientsSidebar";
import { useSafePathname } from "@hooks/useLastSafePathname";
import { useErrorHandler } from "@hooks/useServerErrorHandler";
import { ChannelType } from "@huginn/shared";
import { getChannelsOptions, getMessagesOptions } from "@lib/queries";
import { client, useClient } from "@stores/apiStore";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type LoaderFunctionArgs, useParams } from "react-router";

export async function channelWithIdLoader({ params }: LoaderFunctionArgs) {
	return queryClient.ensureInfiniteQueryData(getMessagesOptions(queryClient, client, params.channelId as string));
}

export default function ChannelWithId() {
	const { channelId } = useParams() as { channelId: string };
	const client = useClient();
	const queryClient = useQueryClient();
	const { error, data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, channelId));
	const channel = useSuspenseQuery(getChannelsOptions(client, "@me")).data?.find((x: { id: string }) => x.id === channelId);
	const { navigateBack } = useSafePathname();

	const handleServerError = useErrorHandler();

	const [recipientsVisible, setRecipientsVisible] = useState(true);

	useEffect(() => {
		if (!channel) {
			console.log("NOPE");
			navigateBack();
			return;
		}
		if (error) {
			handleServerError(error);
		}
	}, [error]);

	function onRecipientsClick() {
		setRecipientsVisible((prev) => !prev);
	}

	return (
		channel && (
			<div className="flex h-full flex-col">
				<HomeTopbar channel={channel} onRecipientsClick={onRecipientsClick} />
				<div className="h-0.5 flex-shrink-0 bg-white/10" />
				<div className="flex h-full w-full overflow-hidden">
					<div className="flex h-full w-full flex-col overflow-hidden">
						<DirectChannelCall channelId={channelId} />
						<ChannelMessages channelId={channelId} messages={messages.pages.flat()} />
						<MessageBox messages={messages.pages.flat()} />
					</div>
					{channel.type === ChannelType.GROUP_DM && channel.ownerId && (
						<RecipientsSidebar
							channelId={channel.id}
							recipientIds={channel.recipientIds}
							ownerId={channel.ownerId}
							visible={recipientsVisible}
						/>
					)}
				</div>
				<div className="absolute bottom-0 flex h-16 w-full flex-shrink-0 bg-background" />
			</div>
		)
	);
}
