import VoiceOverlay from "@components/voice/VoiceOverlay";
import { useVoicePopoutBootstrap } from "@hooks/voice/useVoicePopoutBootstrap";
import { queryClient } from "@lib/queries";
import { QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/overlay")({
   component: RouteComponent,
});

function RouteComponent() {
   const { error, isReady } = useVoicePopoutBootstrap({ allowDisconnected: true });

   if (error || !isReady) return null;

   return (
      <QueryClientProvider client={queryClient}>
         <VoiceOverlay />
      </QueryClientProvider>
   );
}
