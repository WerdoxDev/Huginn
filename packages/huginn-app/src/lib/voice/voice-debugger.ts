import type { HuginnClient } from "@huginn/api";
import type { Snowflake } from "@huginn/shared";

import { voiceStore } from "@stores/voiceStore";
import { windowStore } from "@stores/windowStore";

import type {
   ALCData,
   ASPData,
   AudioContextData,
   ConsumerDebugData,
   ProducerDebugData,
   StatsParserData,
   TrackData,
   VoiceStatesDebugData,
   VoiceDebugData,
   AppUser,
   UsersDebugData,
   Environment,
} from "@/types";

import { queryClient } from "@/lib/queries";

import type { VoiceBridge } from "./voice-bridge";

import { WebRTCStatsParser } from "./stats-parser";

export class VoiceDebugger {
   private client: HuginnClient<VoiceBridge>;
   private browserWindow?: Window | null;
   private dataInterval?: ReturnType<typeof setInterval>;
   private channel?: BroadcastChannel;
   private statsParsers: Map<string, WebRTCStatsParser> = new Map();
   private environment: Environment;

   public constructor(client: HuginnClient<VoiceBridge>) {
      this.client = client;
      this.environment = windowStore.getState().environment;
   }

   private async isDebuggerOpen() {
      if (this.environment === "desktop") {
         return await window.electronAPI.isVoiceDebugOpen();
      } else {
         return this.browserWindow && !this.browserWindow.closed;
      }
   }

   public async openDebugger() {
      if (await this.isDebuggerOpen()) return;

      if (this.environment === "desktop") {
         window.electronAPI.openVoiceDebug();
      } else {
         this.browserWindow = window.open("/app/voice-debug", "debug", "width=500,height=600");
         if (!this.browserWindow) {
            throw new Error("Debugger window was not opened");
         }
      }

      this.startDataInterval();
   }

   public closeDebugger() {
      const store = windowStore.getState();

      if (store.environment === "desktop") {
         window.electronAPI.closeVoiceDebug();
      } else {
         if (this.browserWindow && !this.browserWindow.closed) {
            this.browserWindow.close();
         }
         this.browserWindow = undefined;
      }

      this.stopDataInterval();
   }

   private startDataInterval() {
      this.channel = new BroadcastChannel("voice-debug");

      this.dataInterval = setInterval(async () => {
         if (!(await this.isDebuggerOpen())) {
            this.stopDataInterval();
            return;
         }

         const alcData = Array.from(
            this.client.voice.audioLevelCheckers.values().map((x) => {
               const streamData: ALCData["stream"] = x.stream
                  ? {
                       id: x.stream.id,
                       audioTracks: x.stream.getAudioTracks().map((track) => ({
                          id: track.id,
                          kind: track.kind,
                          readyState: track.readyState,
                          enabled: track.enabled,
                          label: track.label,
                          muted: track.muted,
                          settings: track.getSettings(),
                       })),
                       videoTracks: x.stream.getVideoTracks().map((track) => ({
                          id: track.id,
                          kind: track.kind,
                          readyState: track.readyState,
                          enabled: track.enabled,
                          label: track.label,
                          muted: track.muted,
                          settings: track.getSettings(),
                       })),
                    }
                  : undefined;

               const contextData = this.getAudioContextData(x.audioContext);

               const data: ALCData = {
                  producerId: x.producerId,
                  consumerId: x.consumerId,
                  currentDb: x.currentDb,
                  userId: x.userId,
                  kind: x.kind,
                  isStopped: x.isStopped,
                  stream: streamData,
                  context: contextData,
               };

               return data;
            }),
         );

         const aspData = Array.from(
            this.client.voice.audioSourcePlayers.map((x) => {
               const streamData: ALCData["stream"] = x.stream
                  ? {
                       id: x.stream.id,
                       audioTracks: x.stream.getAudioTracks().map((track) => this.getTrackData(track)!),
                       videoTracks: x.stream.getVideoTracks().map((track) => this.getTrackData(track)!),
                    }
                  : undefined;

               const contextData = this.getAudioContextData(x.audioContext);

               const data: ASPData = {
                  globalGain: x.globalGain,
                  localGain: x.localGain,
                  gain: x.gainNode.gain.value,
                  kind: x.kind,
                  producerId: x.producerId,
                  userId: x.userId,
                  stream: streamData,
                  context: contextData,
               };

               return data;
            }),
         );

         const consumers = this.client.voice.transport.getConsumers();
         const producers = this.client.voice.transport.getProducers();
         const localConsumersData: Array<ConsumerDebugData> = [];
         const localProducersData: Array<ProducerDebugData> = [];

         for (const consumer of consumers) {
            let statsParser = this.statsParsers.get(consumer.id);
            if (!statsParser) {
               statsParser = new WebRTCStatsParser(consumer.id, "consumer");
               this.statsParsers.set(consumer.id, statsParser);
            }

            const trackData = this.getTrackData(consumer.track);
            localConsumersData.push({
               id: consumer.id,
               producerId: consumer.producerId,
               kind: consumer.kind,
               mediaKind: consumer.appData.mediaKind,
               userId: consumer.appData.userId,
               track: trackData!,
               stats: statsParser.parseConsumer(await consumer.getStats()),
               type: "local",
            });
         }

         for (const producer of producers) {
            let statsParser = this.statsParsers.get(producer.id);
            if (!statsParser) {
               statsParser = new WebRTCStatsParser(producer.id, "producer");
               this.statsParsers.set(producer.id, statsParser);
            }

            const trackData = this.getTrackData(producer.track);

            localProducersData.push({
               id: producer.id,
               kind: producer.kind,
               mediaKind: producer.appData.mediaKind,
               userId: producer.appData.userId,
               track: trackData,
               stats: statsParser.parseProducer(await producer.getStats()),
               type: "local",
            });
         }

         for (const statsParser of this.statsParsers.values()) {
            if (statsParser.type === "consumer" && !consumers.some((x) => x.id === statsParser.id)) {
               this.statsParsers.delete(statsParser.id);
            }

            if (statsParser.type === "producer" && !producers.some((x) => x.id === statsParser.id)) {
               this.statsParsers.delete(statsParser.id);
            }
         }

         const statsParsersData: Array<StatsParserData> = Array.from(this.statsParsers.values().map((x) => ({ id: x.id, type: x.type })));

         const remoteConsumersData: Array<ConsumerDebugData> = this.client.voice.transport.getRemoteConsumers().map((x) => ({
            id: x.consumerId,
            producerId: x.producerId,
            mediaKind: x.kind,
            type: "remote",
            userId: x.userId,
         }));
         const remoteProducersData: Array<ProducerDebugData> = this.client.voice.transport.getRemoteProducers().map((x) => ({
            id: x.producerId,
            mediaKind: x.kind,
            type: "remote",
            userId: x.userId,
         }));

         const store = voiceStore.getState();
         const voiceStatesData: Array<VoiceStatesDebugData> = store.voiceStates.map((x) => ({
            ...x,
            speaking: store.speakingStates.find((y) => y.userId === x.userId)?.speaking ?? undefined,
         }));

         const userIds = store.voiceStates.map((x) => x.userId);
         const usersData: UsersDebugData[] = queryClient
            .getQueriesData<AppUser>({
               predicate(query) {
                  const key = query.queryKey;
                  return key[0] === "user" && userIds.includes(key[1] as Snowflake);
               },
            })
            .map((x) => x[1])
            .filter((x) => !!x);

         const data: VoiceDebugData = {
            alcData,
            aspData,
            statsParsersData,
            consumersData: [...localConsumersData, ...remoteConsumersData],
            producersData: [...localProducersData, ...remoteProducersData],
            voiceStatesData,
            usersData,
         };
         this.channel?.postMessage(data);
      }, 1000);
   }

   private stopDataInterval() {
      if (this.dataInterval) {
         clearInterval(this.dataInterval);
         this.dataInterval = undefined;
         this.channel?.close();
      }
   }

   private getTrackData(track?: MediaStreamTrack | null): TrackData | undefined {
      return track
         ? {
              id: track.id,
              kind: track.kind,
              readyState: track.readyState,
              enabled: track.enabled,
              label: track.label,
              muted: track.muted,
              settings: track.getSettings(),
           }
         : undefined;
   }

   private getAudioContextData(audioContext?: AudioContext): AudioContextData | undefined {
      return audioContext
         ? {
              baseLatency: audioContext?.baseLatency,
              outputLatency: audioContext.outputLatency,
              state: audioContext.state,
              sinkId: audioContext.sinkId,
           }
         : undefined;
   }
}
