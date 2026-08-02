import { HuginnMenu } from "@components/dropdown/HuginnMenu";
import { useMaybeUser } from "@hooks/api-hooks/userHooks";
import { useVoiceSnapshot } from "@hooks/voice/useMediaSources";
import { useVoiceUtils } from "@hooks/voice/useVoiceUtils";
import { isChildWindow } from "@lib/child-window";
import { useMemo } from "react";

import type { MediaSource } from "@/types";

export default function VoicePopoutIndicator() {
   const { popoutState, mediaSources } = useVoiceSnapshot();
   const { focusMediaPopout } = useVoiceUtils();

   const poppedOutMedia = useMemo(
      () =>
         popoutState.openMediaPopoutProducers.map((producerId) => ({
            producerId,
            mediaSource: mediaSources.find((mediaSource) => mediaSource.producerId === producerId),
         })),
      [mediaSources, popoutState.openMediaPopoutProducers],
   );

   if (poppedOutMedia.length === 0 || (popoutState.isPopoutOpen && !isChildWindow())) return null;

   return (
      <div className="absolute top-3 right-3 z-30">
         <HuginnMenu>
            <HuginnMenu.Trigger className="border-surface bg-surface-void hover:bg-surface-deep text-text flex items-center gap-x-2 rounded-lg border px-2 py-2 transition-colors">
               <IconMingcuteLayoutBottomOpenFill className="size-5" />
               <span>{poppedOutMedia.length} popped out</span>
               <IconMingcuteDownFill className="size-5 text-white/60" />
            </HuginnMenu.Trigger>
            <HuginnMenu.Content align="end" side="bottom" sideOffset={4} className="border-surface min-w-52 border">
               {poppedOutMedia.map(({ producerId, mediaSource }) =>
                  mediaSource ? (
                     <PoppedOutMediaMenuItem key={producerId} mediaSource={mediaSource} onFocus={() => focusMediaPopout(producerId)} />
                  ) : (
                     <HuginnMenu.Item key={producerId} label="Popped-out media" onClick={() => focusMediaPopout(producerId)} />
                  ),
               )}
            </HuginnMenu.Content>
         </HuginnMenu>
      </div>
   );
}

function PoppedOutMediaMenuItem(props: { mediaSource: MediaSource; onFocus: () => void }) {
   const user = useMaybeUser(props.mediaSource.userId);
   const displayName = user?.displayName ?? user?.username ?? "Unknown user";
   const mediaLabel = props.mediaSource.kind === "camera" ? "camera" : props.mediaSource.kind === "stream_audio" ? "audio stream" : "screen share";

   return <HuginnMenu.Item label={`${displayName}'s ${mediaLabel}`} onClick={props.onFocus} />;
}
