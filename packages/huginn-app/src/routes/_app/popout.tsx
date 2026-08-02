import DirectChannelCall from "@components/channels/DirectChannelCall";
import { useVoicePopoutBootstrap } from "@hooks/voice/useVoicePopoutBootstrap";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/popout")({
   component: RouteComponent,
});

function RouteComponent() {
   const { channelId, error } = useVoicePopoutBootstrap();

   if (error) return <div className="text-text flex h-full items-center justify-center p-5 text-center">{error}</div>;
   if (!channelId) return null;

   return <DirectChannelCall channelId={channelId} />;
}
