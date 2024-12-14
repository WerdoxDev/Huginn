import { ChannelType } from "@huginn/shared";
import { useQuery, useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import type { Route } from "./+types/channels.@me.$channelId";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
	return queryClient.ensureInfiniteQueryData(getMessagesOptions(queryClient, client, params.channelId));
}

export default function Component({ params: { channelId } }: Route.ComponentProps) {
	const client = useClient();
	const queryClient = useQueryClient();
	const { error, data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, channelId));
	const channel = useSuspenseQuery(getChannelsOptions(client, "@me")).data?.find((x: { id: string }) => x.id === channelId);
	const { navigateBack } = useSafePathname();

	const handleServerError = useErrorHandler();

	const [recipientsVisible, setRecipientsVisible] = useState(true);

	useEffect(() => {
		if (!channel) {
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
					<ChannelMessages channelId={channelId} messages={messages.pages.flat()} />
					{channel.type === ChannelType.GROUP_DM && channel.ownerId && (
						<RecipientsSidebar channelId={channel.id} recipients={channel.recipients} ownerId={channel.ownerId} visible={recipientsVisible} />
					)}
				</div>
				<div className="flex h-16 w-full flex-shrink-0 bg-background">
					<MessageBox />
					{/* <div className="h-full w-64 flex-shrink-0" /> */}
				</div>
			</div>
		)
	);
}
