import VoiceElement from "@components/voice/VoiceElement";
import { useVoicePreferences } from "@hooks/useVoicePreferences";
import { useVoiceSnapshot } from "@hooks/voice/useMediaSources";
import { useVoicePopoutBootstrap } from "@hooks/voice/useVoicePopoutBootstrap";
import { getVoiceMediaTarget } from "@lib/child-window";
import { useVoiceStore } from "@stores/voiceStore";
import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/_app/media-popout")({
   component: RouteComponent,
});

function RouteComponent() {
   const { channelId, error, isReady } = useVoicePopoutBootstrap();
   const { mediaSources } = useVoiceSnapshot();
   const { voiceState: ourVoiceState, voiceStates, speakingStates } = useVoiceStore();
   const { voicePreferences } = useVoicePreferences();
   const containerRef = useRef<HTMLDivElement>(null);
   const [size, setSize] = useState({ width: 0, height: 0 });
   const target = useMemo(() => getVoiceMediaTarget(), []);

   const mediaSource = useMemo(
      () => (target ? mediaSources.find((source) => source.producerId === target.producerId && source.userId === target.userId) : undefined),
      [mediaSources, target],
   );

   const secondMediaSource = useMemo(
      () =>
         mediaSource?.kind === "stream_video"
            ? mediaSources.find((source) => source.userId === mediaSource.userId && source.kind === "stream_audio")
            : mediaSource?.kind === "camera"
              ? mediaSources.find((source) => source.userId === mediaSource.userId && source.kind === "microphone")
              : undefined,
      [mediaSource, mediaSources],
   );
   const voiceState = useMemo(() => voiceStates.find((state) => state.userId === target?.userId), [target, voiceStates]);
   const voicePreference = useMemo(() => voicePreferences?.find((preference) => preference.userId === target?.userId), [target, voicePreferences]);
   const speakingState = useMemo(() => speakingStates.find((state) => state.userId === target?.userId), [target, speakingStates]);

   const type = useMemo(() => {
      if (!mediaSource) return "normal";
      if (mediaSource.kind === "stream_video" || mediaSource.kind === "stream_audio") return "stream";
      if (mediaSource.kind === "camera") return "normal";
      return "normal";
   }, [mediaSource]);

   useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const observer = new ResizeObserver(([entry]) => {
         setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) });
      });
      observer.observe(container);
      return () => observer.disconnect();
   }, []);

   if (error) return <StatusMessage>{error}</StatusMessage>;
   if (!isReady || !channelId) return null;
   if (!target) return <StatusMessage>This media popout has no stream target.</StatusMessage>;
   if (!mediaSource || !voiceState) return <StatusMessage>This media has ended.</StatusMessage>;

   return (
      <div ref={containerRef} className="bg-surface-deep group/wrapper flex h-full w-full items-center justify-center overflow-hidden">
         <VoiceElement
            type={type}
            gridElementWidth={size.width}
            gridElementHeight={size.height}
            userId={target.userId}
            channelId={channelId}
            guildId={ourVoiceState.guildId ?? null}
            isConnected={ourVoiceState.channelId === channelId}
            isGridView
            isMaximized
            isSpeaking={speakingState?.speaking ?? false}
            mediaSource={mediaSource}
            secondMediaSource={secondMediaSource}
            voicePreference={voicePreference}
            voiceState={voiceState}
         />
      </div>
   );
}

function StatusMessage(props: { children: string }) {
   return <div className="text-text flex h-full items-center justify-center p-5 text-center">{props.children}</div>;
}
