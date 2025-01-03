import { ChannelType } from "@huginn/shared";
import { useQueryClient, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute, getRouteApi } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId")({
	component: Component,
	errorComponent: RouteErrorComponent,
});

const api = getRouteApi("/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId");

function Component() {
	const client = useClient();
	const queryClient = useQueryClient();
	const { channelId } = api.useParams();
	const { error, data: messages } = useSuspenseInfiniteQuery(getMessagesOptions(queryClient, client, channelId));
	const channel = useSuspenseQuery(getChannelsOptions(client, "@me")).data?.find((x: { id: string }) => x.id === channelId);
	const { navigateBack } = useSafePathname();

	const handleServerError = useErrorHandler();

	const [recipientsVisible, setRecipientsVisible] = useState(true);

	useEffect(() => {
		if (error) {
			handleServerError(error);
		}
	}, [error]);

	if (!channel) {
		navigateBack();
		return;
	}

	function onRecipientsClick() {
		setRecipientsVisible((prev) => !prev);
	}

	return (
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
	);
}
