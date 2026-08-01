import type { HuginnClient, VoiceStreamOptions } from "@huginnjs/api";

import { storageStore } from "@stores/storageStore";

import type { MediaSource, PopoutState } from "@/types";

import type { VoiceBridge } from "./voice-bridge";
import type {
   CapturedStreamOptions,
   VoiceEvent,
   VoiceEvents,
   VoiceHostSnapshot,
   VoiceMessage,
   VoiceRequest,
   VoiceResult,
   VoiceResults,
   VoiceStreamUpdate,
} from "./voice-protocol";

import { VoiceClient } from "./voice-client";

type VoiceEventWithoutData = {
   [K in keyof VoiceEvents]: VoiceEvents[K] extends undefined ? K : never;
}[keyof VoiceEvents];

export class VoiceHost {
   public readonly hostId: string;

   private channel: BroadcastChannel;
   private voice: VoiceBridge;
   private client: HuginnClient<VoiceBridge>;
   private tracks = new Map<string, MediaStreamTrack>();
   private mediaSources: MediaSource[] = [];
   private popoutState: PopoutState = { isPopoutOpen: false, openMediaPopoutProducers: [] };
   private unlisteners: Array<() => void> = [];
   private mutationQueue: Promise<void> = Promise.resolve();
   private mediaUpdateScheduled = false;
   private disposed = false;

   public constructor(hostId: string, voice: VoiceBridge, client: HuginnClient<VoiceBridge>) {
      this.hostId = hostId;
      this.voice = voice;
      this.client = client;
      this.channel = new BroadcastChannel(`voice:${hostId}`);
      this.channel.onmessage = (event) => this.onMessage(event);

      VoiceClient.configure(hostId);
      this.registerEvents();

      // voice host is there to provide error propagation and access to the tracks for the popout window
      window.voiceHost = {
         hostId,
         getTrack: (id?: string) => (!id ? null : (this.tracks.get(id) ?? null)),
         openCamera: (track) => this.enqueueMutation(() => this.openCamera(track)),
         openCapturedStream: (options) => this.enqueueMutation(() => this.openCapturedStream(options)),
         openStream: (videoTrack, audioTrack, options) => this.enqueueMutation(() => this.openStream(videoTrack, audioTrack, options)),
      };

      const dispose = () => this.dispose();
      window.addEventListener("pagehide", dispose, { once: true });
      this.unlisteners.push(() => window.removeEventListener("pagehide", dispose));

      this.scheduleMediaSourceUpdate();
   }

   public getSnapshot(): VoiceHostSnapshot {
      this.refreshMediaSources(false);
      const connectionData = this.voice.signaling.connectionData;

      return {
         hostId: this.hostId,
         status: this.voice.status,
         connection: connectionData
            ? {
                 channelId: connectionData.channelId,
                 guildId: connectionData.guildId,
              }
            : null,
         mediaSources: this.mediaSources,
         popoutState: this.popoutState,
      };
   }

   public dispose(): void {
      if (this.disposed) return;
      this.disposed = true;

      for (const unlisten of this.unlisteners.splice(0)) unlisten();
      this.channel.close();
      this.tracks.clear();
      this.mediaSources = [];

      if (window.voiceHost?.hostId === this.hostId) {
         delete window.voiceHost;
         VoiceClient.dispose();
      }
   }

   private registerEvents(): void {
      const scheduleMediaUpdate = () => this.scheduleMediaSourceUpdate();

      this.unlisteners.push(this.voice.transport.listen("producer_created", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("consumer_created", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("producer_closed", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("consumer_closed", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("producer_updated", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("remote_consumer_created", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("remote_producer_created", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("remote_consumer_closed", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("remote_producer_closed", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.transport.listen("reset", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.stream.listen("video_constraints_updated", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.stream.listen("video_bitrate_updated", scheduleMediaUpdate));
      this.unlisteners.push(this.voice.stream.listen("audio_bitrate_updated", scheduleMediaUpdate));

      if (!this.voice.popout) return;
      const refreshPopoutState = () => this.refreshPopoutState(true);
      this.unlisteners.push(this.voice.popout.listen("popout_opened", refreshPopoutState));
      this.unlisteners.push(this.voice.popout.listen("popout_closed", refreshPopoutState));
      this.unlisteners.push(this.voice.popout.listen("media_popout_opened", refreshPopoutState));
      this.unlisteners.push(this.voice.popout.listen("media_popout_closed", refreshPopoutState));
   }

   private onMessage(event: MessageEvent<VoiceMessage>): void {
      const request = event.data;
      if (request.kind !== "request" || request.hostId !== this.hostId) return;

      const handle = async () => {
         try {
            switch (request.type) {
               case "get_snapshot":
                  this.sendResult(request, this.getSnapshot());
                  break;
               case "toggle_mute":
                  await this.handleToggleMute();
                  this.sendResult(request, undefined);
                  break;
               case "toggle_deafen":
                  await this.handleToggleDeafen();
                  this.sendResult(request, undefined);
                  break;
               case "connect_voice":
                  await this.client.voiceManager.connectVoice(request.data.guildId, request.data.channelId);
                  this.sendResult(request, undefined);
                  break;
               case "disconnect_voice":
                  await this.client.voiceManager.disconnectVoice();
                  this.sendResult(request, undefined);
                  break;
               case "consume_stream":
                  await this.handleConsumeStream(request.data.userId, request.data.guildId, request.data.channelId);
                  this.sendResult(request, undefined);
                  break;
               case "unconsume_stream":
                  await this.handleUnconsumeStream(request.data.userId);
                  this.sendResult(request, undefined);
                  break;
               case "open_audio_stream":
                  await this.handleOpenAudioStream(request.data.processId, request.data.maxAudioBitrate);
                  this.sendResult(request, undefined);
                  break;
               case "prepare_stream_replacement":
                  this.voice.transport.getProducer("stream_video")?.track?.stop();
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                  this.sendResult(request, undefined);
                  break;
               case "update_stream":
                  await this.handleUpdateStream(request.data);
                  this.sendResult(request, undefined);
                  break;
               case "close_stream":
                  await this.voice.stream.closeStream();
                  this.sendResult(request, undefined);
                  break;
               case "close_camera":
                  await this.voice.device.closeCamera();
                  this.sendResult(request, undefined);
                  break;
               case "open_popout":
                  this.client.voice.popout?.openVoicePopout();
                  this.sendResult(request, undefined);
                  break;
               case "open_media_popout":
                  this.client.voice.popout?.openMediaPopout(request.data);
                  this.sendResult(request, undefined);
                  break;
               case "focus_media_popout":
                  this.client.voice.popout?.focusMediaPopout(request.data);
                  this.sendResult(request, undefined);
                  break;
               default:
                  throw new Error(`Unsupported voice request: ${String((request as VoiceRequest).type)}`);
            }
         } catch (error) {
            this.sendError(request, error);
         }
      };

      if (request.type === "get_snapshot") {
         void handle();
      } else {
         void this.enqueueMutation(handle);
      }
   }

   private enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
      const result = this.mutationQueue.then(operation);
      this.mutationQueue = result.then(
         () => undefined,
         () => undefined,
      );
      return result;
   }

   private sendEvent<K extends VoiceEventWithoutData>(type: K): void;
   private sendEvent<K extends keyof VoiceEvents>(type: K, data: VoiceEvents[K]): void;
   private sendEvent(type: keyof VoiceEvents, data?: VoiceEvents[keyof VoiceEvents]): void {
      if (this.disposed) return;
      this.channel.postMessage({ kind: "event", hostId: this.hostId, type, data } as VoiceEvent);
   }

   private sendResult<K extends keyof VoiceResults>(request: Extract<VoiceRequest, { type: K }>, result: VoiceResults[K]): void {
      const message = {
         kind: "result",
         hostId: this.hostId,
         requestId: request.requestId,
         type: request.type,
         result,
      } as VoiceResult;
      this.channel.postMessage(message);
   }

   private sendError(request: VoiceRequest, error: unknown): void {
      const message: VoiceResult = {
         kind: "result",
         hostId: this.hostId,
         requestId: request.requestId,
         type: request.type,
         error: error instanceof Error ? error.message : String(error),
      } as VoiceResult;
      this.channel.postMessage(message);
   }

   private scheduleMediaSourceUpdate(): void {
      if (this.mediaUpdateScheduled || this.disposed) return;
      this.mediaUpdateScheduled = true;

      queueMicrotask(() => {
         this.mediaUpdateScheduled = false;
         if (this.disposed) return;
         this.refreshMediaSources(true);
      });
   }

   private refreshMediaSources(broadcast: boolean): void {
      const sources: MediaSource[] = [];
      const tracks = new Map<string, MediaStreamTrack>();
      const remoteConsumers = this.voice.transport.getRemoteConsumers();
      const currentUserId = this.voice.client.currentUser?.id;

      for (const consumer of this.voice.transport.getConsumers()) {
         sources.push({
            userId: consumer.appData.userId,
            kind: consumer.appData.mediaKind,
            consumerUserIds: [
               ...(currentUserId ? [currentUserId] : []),
               ...remoteConsumers.filter((x) => x.producerId === consumer.producerId).map((x) => x.userId),
            ],
            consumerId: consumer.id,
            producerId: consumer.producerId,
            trackSettings: consumer.track.getSettings(),
            type: "consuming",
         });
         tracks.set(consumer.id, consumer.track);
      }

      for (const producer of this.voice.transport.getProducers()) {
         sources.push({
            userId: producer.appData.userId,
            kind: producer.appData.mediaKind,
            consumerUserIds: remoteConsumers.filter((x) => x.producerId === producer.id).map((x) => x.userId),
            consumerId: undefined,
            producerId: producer.id,
            trackSettings: producer.track?.getSettings(),
            maxBitrate: producer.rtpSender?.getParameters().encodings?.at(-1)?.maxBitrate,
            type: "producing",
         });
         if (producer.track) tracks.set(producer.id, producer.track);
      }

      for (const remoteProducer of this.voice.transport.getRemoteProducers()) {
         if (sources.some((x) => x.producerId === remoteProducer.producerId)) continue;

         sources.push({
            userId: remoteProducer.userId,
            kind: remoteProducer.kind,
            consumerUserIds: remoteConsumers.filter((x) => x.producerId === remoteProducer.producerId).map((x) => x.userId),
            producerId: remoteProducer.producerId,
            consumerId: undefined,
            type: "consumable",
         });
      }

      this.mediaSources = sources;
      this.tracks = tracks;
      if (broadcast) this.sendEvent("media_sources_updated", sources);
   }

   private refreshPopoutState(broadcast: boolean): void {
      const isPopoutOpen = (this.voice.popout?.popoutWindow && !this.voice.popout.popoutWindow.closed) ?? false;
      const openMediaPopouts = Array.from(this.voice.popout?.mediaWindows.keys() || []);
      this.popoutState = { isPopoutOpen, openMediaPopoutProducers: openMediaPopouts };

      if (broadcast) {
         this.sendEvent("popout_state_updated", this.popoutState);
      }
   }

   private async openCamera(track: MediaStreamTrack): Promise<void> {
      if (this.voice.transport.getProducer("camera")) {
         await this.voice.device.replaceCameraTrack(track);
      } else {
         await this.voice.device.openCamera(track);
      }
   }

   private async openCapturedStream(options: CapturedStreamOptions): Promise<void> {
      await this.voice.stopAudioLoopback();

      let audioTrack: MediaStreamTrack | undefined = options.stream.getAudioTracks()[0];
      if (!audioTrack && options.isAudioEnabled && options.type !== "device") {
         audioTrack = await this.voice.startAudioLoopback(options.type === "screen" ? "system" : "application", options.processId);
      }

      const videoTrack = options.stream.getVideoTracks()[0];
      if (!videoTrack) throw new Error("Video track was null when opening a stream");

      await this.openStream(videoTrack, audioTrack, {
         useSimulcast: options.isSimulcastEnabled,
         maxAudioBitrate: options.maxAudioBitrate,
         maxVideoBitrate: options.maxVideoBitrate,
      });
   }

   private async openStream(videoTrack: MediaStreamTrack, audioTrack?: MediaStreamTrack, options?: VoiceStreamOptions): Promise<void> {
      const videoProducer = this.voice.transport.getProducer("stream_video");
      const audioProducer = this.voice.transport.getProducer("stream_audio");

      if (videoProducer) {
         await this.voice.stream.replaceStreamVideoTrack(videoTrack);
         if (options?.maxVideoBitrate) await this.voice.stream.updateVideoBitrate(options.maxVideoBitrate);
      } else {
         await this.voice.stream.openStream(videoTrack, audioTrack, options);
         return;
      }

      if (audioProducer && audioTrack) {
         await this.voice.stream.replaceStreamAudioTrack(audioTrack);
         if (options?.maxAudioBitrate) await this.voice.stream.updateAudioBitrate(options.maxAudioBitrate);
      } else if (audioProducer && !audioTrack) {
         await this.voice.stream.closeStreamAudio();
      } else if (audioTrack) {
         await this.voice.stream.openStream(undefined, audioTrack, options);
      }
   }

   private async handleOpenAudioStream(processId: number, maxAudioBitrate: number): Promise<void> {
      await this.voice.stopAudioLoopback();
      const audioTrack = await this.voice.startAudioLoopback("application", processId);
      if (!audioTrack) throw new Error("Audio track was null when opening audio stream");

      const producer = this.voice.transport.getProducer("stream_audio");
      if (producer) {
         await this.voice.stream.replaceStreamAudioTrack(audioTrack);
         if (maxAudioBitrate) await this.voice.stream.updateAudioBitrate(maxAudioBitrate);
      } else {
         await this.voice.stream.openStream(undefined, audioTrack, { maxAudioBitrate });
      }
   }

   private async handleConsumeStream(userId: string, guildId: string | null, channelId: string): Promise<void> {
      if (this.voice.status === "disconnected") throw new Error("Voice is disconnected");
      if (this.voice.status !== "ready") await this.client.voiceManager.connectVoice(guildId, channelId);

      const remoteProducers = this.voice.transport.getRemoteProducers();
      if (remoteProducers.some((x) => x.kind === "stream_video" && x.userId === userId)) {
         await this.voice.transport.createConsumer(userId, "stream_video");
      }
      if (remoteProducers.some((x) => x.kind === "stream_audio" && x.userId === userId)) {
         await this.voice.transport.createConsumer(userId, "stream_audio");
      }

      await this.client.voiceManager.applyVoiceState();
   }

   private async handleUnconsumeStream(userId: string): Promise<void> {
      const videoConsumer = this.voice.transport.getConsumer(userId, "stream_video");
      const audioConsumer = this.voice.transport.getConsumer(userId, "stream_audio");

      if (videoConsumer) await this.voice.transport.closeConsumer(videoConsumer.id);
      if (audioConsumer) await this.voice.transport.closeConsumer(audioConsumer.id);
   }

   private async handleUpdateStream(update: VoiceStreamUpdate): Promise<void> {
      if (update.video) await this.voice.stream.updateVideoParameters(update.video);
      if (update.audio?.maxBitrate) await this.voice.stream.updateAudioBitrate(update.audio.maxBitrate);
   }

   private async handleToggleMute(): Promise<void> {
      const voiceState = this.client.voiceManager.voiceState.gatewayVoiceState;
      const newMutedState = !(voiceState?.isAudioMuted ?? false);
      const newDeafenedState = newMutedState ? (voiceState?.isAudioDeafened ?? false) : false;
      const store = storageStore.getState();
      const settings = await store.getValue("settings");

      await this.client.voiceManager.voiceState.updateGatewayVoiceState({
         isAudioMuted: newMutedState,
         isAudioDeafened: newDeafenedState,
      });
      await store.setValue("settings", { ...settings, isVoiceMuted: newMutedState, isVoiceDeafened: newDeafenedState });
   }

   private async handleToggleDeafen(): Promise<void> {
      const voiceState = this.client.voiceManager.voiceState.gatewayVoiceState;
      const newDeafenedState = !(voiceState?.isAudioDeafened ?? false);
      const store = storageStore.getState();
      const settings = await store.getValue("settings");

      await this.client.voiceManager.voiceState.updateGatewayVoiceState({
         isAudioDeafened: newDeafenedState,
         isAudioMuted: newDeafenedState ? true : settings.isVoiceMuted,
      });
      await store.setValue("settings", { ...settings, isVoiceDeafened: newDeafenedState });
   }
}
