import { type Snowflake, log, error } from "@huginn/shared";
import type { Gateway } from "./gateway";
import type { Voice } from ".";
import { VoiceState } from "./voice-state";

export class VoiceManager<V extends Voice = Voice> {
   private gateway: Gateway;
   private voice: V;
   public voiceState: VoiceState;

   private isConnecting = false;

   public constructor(gateway: Gateway, voice: V) {
      this.gateway = gateway;
      this.voice = voice;
      this.voiceState = new VoiceState();

      this.listenVoiceManagerEvents();
      this.listenVoiceTransportManagerEvents();

      // When gateway reconnects, we need to send the voice state again, like connecting to the voice for the first time
      this.gateway.on("reconnected", async () => {
         if (this.voice.status === "ready") {
            this.voice.signaling.checkStatus();
            const connectionData = this.voice.signaling.connectionData;
            await this.gateway.sendUpdateVoiceState(this.voiceState.gatewayVoiceState, connectionData.channelId, connectionData.guildId);
         }
      });
   }

   private listenVoiceManagerEvents() {
      this.voiceState.on("update_gateway_voice_state", async (d) => {
         // Try catch is to simply confirm the voice state when signaling is not connected
         try {
            this.voice.signaling.checkStatus();
            const connectionData = this.voice.signaling.connectionData;
            const { isAudioDeafened, isAudioMuted, isAudioStreaming, isScreenSharing, isCameraOn } = await this.gateway.sendUpdateVoiceState(
               d.voiceState,
               connectionData.channelId,
               connectionData.guildId,
            );
            d.callback({ isAudioDeafened, isAudioMuted, isCameraOn, isAudioStreaming, isScreenSharing });

            // oxlint-disable-next-line no-unused-vars
         } catch (e) {
            d.callback(d.voiceState);
         }
      });

      this.voiceState.on("gateway_voice_state_updated", () => {
         this.voice.transport.applyVoiceState(this.voiceState.gatewayVoiceState, this.voiceState.localVoiceState);
      });

      this.voiceState.on("local_voice_state_updated", () => {
         this.voice.transport.applyVoiceState(this.voiceState.gatewayVoiceState, this.voiceState.localVoiceState);
      });
   }

   private listenVoiceTransportManagerEvents() {
      // Automatically sets streaming or camera state to true when the producers are opened
      this.voice.transport.on("producer_created", async (d) => {
         switch (d.appData.mediaKind) {
            case "stream_audio":
               if (!this.voice.transport.getProducer("stream_video")) {
                  await this.voiceState.updateGatewayVoiceState({ isAudioStreaming: true });
               }
               break;
            case "stream_video":
               await this.voiceState.updateGatewayVoiceState({ isScreenSharing: true });
               break;
            case "camera":
               await this.voiceState.updateGatewayVoiceState({ isCameraOn: true });
               break;
         }
      });

      // Automatically sets streaming or camera state to false when the producers are closed
      this.voice.transport.on("producer_closed", async (d) => {
         switch (d.kind) {
            case "stream_audio":
               if (this.voiceState.gatewayVoiceState.isAudioStreaming) {
                  await this.voiceState.updateGatewayVoiceState({ isAudioStreaming: false });
               }
               break;
            case "stream_video":
               await this.voiceState.updateGatewayVoiceState({ isScreenSharing: false });
               break;
            case "camera":
               await this.voiceState.updateGatewayVoiceState({ isCameraOn: false });
               break;
         }
      });

      this.voice.transport.on("reset", async () => {
         await this.voiceState.updateGatewayVoiceState({ isCameraOn: false, isAudioStreaming: false, isScreenSharing: false });
      });
   }

   /**
    * Connects to a voice channel.
    * @param guildId can be set to null if you are connecting to a direct channel call.
    * @param channelId the channel to connect to
    * @param token if a token is already available, it will use that to connect the voice websocket (use with caution)
    */
   public async connectVoice(guildId: Snowflake | null, channelId: Snowflake, token?: string): Promise<void> {
      log("api:voice-manager", "default", "connect to voice");

      if (this.isConnecting) throw new Error("Already trying to connect to a voice channel");

      if (this.voice.signaling.connectionData?.channelId === channelId && this.voice.signaling.connectionData.guildId === guildId) {
         throw new Error("Already connected to the same voice channel");
      }

      this.isConnecting = true;

      if (this.voice.status !== "idle") {
         this.voice.signaling.close();
      }

      let voiceToken: string | undefined;
      if (token) {
         voiceToken = token;
      } else {
         voiceToken = await this.gateway.getVoiceToken(guildId, channelId, this.voiceState.gatewayVoiceState);
      }

      if (!voiceToken) {
         error("api:voice-manager", "Couldn't get a token for voice");
         return;
      }

      this.voice.signaling.connect(voiceToken, channelId, guildId);

      // Wait for ready
      await new Promise<void>((r) => {
         const unlisten = this.voice.listen("status_changed", (d) => {
            if (d === "ready") {
               unlisten();
               r();
            }
         });
      });

      this.isConnecting = false;
   }

   public async disconnectVoice(): Promise<void> {
      log("api:voice-manager", "default", "disconnect voice");

      await this.gateway.sendDefaultVoiceState();
      this.voice.signaling.close();
   }
}
