import { analytics, type Snowflake, recordSpanError, VoiceSignallingError, EventEmitter, CONSTANTS } from "@huginnjs/shared";

import type { HuginnClient, Voice } from ".";
import type { Gateway } from "./gateway";

import { VoiceState } from "./voice-state";

type VoiceToken = { token: string; updatedAt: number };

type Events = {
   voice_token_updated: VoiceToken;
};

export class VoiceManager<V extends Voice = Voice> extends EventEmitter<Events> {
   private client: HuginnClient;
   private gateway: Gateway;
   private voice: V;
   public voiceState: VoiceState;
   private voiceToken: VoiceToken | null = null;

   private isConnecting = false;

   public constructor(client: HuginnClient, gateway: Gateway, voice: V) {
      super();
      this.client = client;
      this.gateway = gateway;
      this.voice = voice;
      this.voiceState = new VoiceState();

      this.listenVoiceStateEvents();
      this.listenVoiceTransportManagerEvents();
      this.listenGatewayEvents();
      this.listenVoiceEvents();

      // When gateway gets authenticated, we need to send the voice state again, like connecting to the voice for the first time
   }

   private getDefaultAttributes() {
      return {
         "gateway.user.id": this.gateway.user?.id ?? "null",
         "voice.gateway.status": this.gateway.status,
         "voice.status": this.voice.status,
         "voice.is_connecting": this.isConnecting,
      };
   }

   private listenVoiceEvents() {
      this.voice.on("update_voice_state", async (d) => {
         try {
            switch (d.mediaKind) {
               case "stream_audio":
                  if (!this.voice.transport.getProducer("stream_video")) {
                     await this.voiceState.updateGatewayVoiceState({ isAudioStreaming: d.isProducing }, false);
                  }
                  break;
               case "stream_video":
                  await this.voiceState.updateGatewayVoiceState({ isScreenSharing: d.isProducing }, false);
                  break;
               case "camera":
                  await this.voiceState.updateGatewayVoiceState({ isCameraOn: d.isProducing }, false);
                  break;
            }

            d.callback(undefined);
         } catch {
            d.callback({ error: VoiceSignallingError.WRONG_STATE });
         }
      });

      this.voice.signaling.on("reacquire_token", async (d) => {
         try {
            await this.voiceState.resendGatewayVoiceState();
            const token = await this.waitForVoiceToken();
            if (!token) throw new Error("Couldn't get a token for voice");

            d.callback(token);
         } catch (e) {
            recordSpanError(e);
            d.errback?.();
            await this.disconnectVoice();
         }
      });
   }

   private listenGatewayEvents() {
      this.gateway.on("status_changed", async (d) => {
         if (d !== "authenticated") return;

         try {
            await this.voiceState.resendGatewayVoiceState();
         } catch (e) {
            recordSpanError(e);
         }
      });

      this.gateway.on("voice_state_update", async (d) => {
         // if not current user, or not in the same channel, ignore
         if (d.userId !== this.client.currentUser?.id || d.sessionId !== this.gateway.sessionId) return;
         this.voiceState.confirmGatewayVoiceState(d);
      });

      this.gateway.on("voice_server_update", (d) => {
         this.voiceToken = { token: d.token, updatedAt: Date.now() };
         this.voice.signaling.setVoiceToken(d.token);
         this.emit("voice_token_updated", this.voiceToken);
      });
   }

   private listenVoiceStateEvents() {
      this.voiceState.on("update_gateway_voice_state", async (d) => {
         try {
            if (d.voiceState.channelId) {
               await this.gateway.updateVoiceState(d.voiceState, d.voiceState.channelId, d.voiceState.guildId);
            } else if (this.gateway.isAuthenticated) {
               await this.gateway.sendDefaultVoiceState();
            }
            d.callback();
         } catch (e) {
            d.errback?.(e);
         }
      });

      this.voiceState.on("gateway_voice_state_updated", async () => {
         await this.applyVoiceState();
      });

      this.voiceState.on("local_voice_state_updated", async () => {
         await this.applyVoiceState();
      });

      this.voiceState.on("voice_preferences_updated", async () => {
         await this.applyVoiceState();
      });
   }

   private listenVoiceTransportManagerEvents() {
      this.voice.transport.on("reset", async () => {
         await this.voiceState.updateGatewayVoiceState({
            isCameraOn: false,
            isAudioStreaming: false,
            isScreenSharing: false,
         });
      });
   }

   private async waitForVoiceToken(): Promise<string> {
      if (this.voiceToken && Date.now() - this.voiceToken.updatedAt < CONSTANTS.VOICE_TOKEN_EXPIRE_TIME_MS) {
         console.log("Using cached voice token", this.voiceToken.token);
         return this.voiceToken.token;
      }

      return await new Promise<string>((r) => {
         const unlisten = this.listen("voice_token_updated", (d) => {
            unlisten();
            console.log("Using new voice token", d.token);
            r(d.token);
         });
      });
   }

   /**
    * Connects to a voice channel.
    * @param guildId can be set to null if you are connecting to a direct channel call.
    * @param channelId the channel to connect to
    * @param token if a token is already available, it will use that to connect the voice websocket (use with caution)
    */
   public async connectVoice(guildId: Snowflake | null, channelId: Snowflake, token?: string): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceManager.connectVoice", async (span): Promise<void> => {
         span.setAttributes({
            ...this.getDefaultAttributes(),
            "params.guild.id": guildId ?? "null",
            "params.channel.id": channelId,
            "params.has_token": !!token,
         });

         try {
            if (this.gateway.status !== "authenticated") throw new Error(`Gateway is not in the correct state: ${this.gateway.status}`);
            if (this.isConnecting) throw new Error("Already trying to connect to a voice channel");

            if (this.voice.signaling.connectionData?.channelId === channelId && this.voice.signaling.connectionData.guildId === guildId) {
               throw new Error("Already connected to the same voice channel");
            }

            this.isConnecting = true;

            try {
               if (this.voice.status !== "idle") {
                  this.voice.signaling.close();
               }

               await this.voiceState.updateGatewayVoiceState({ channelId, guildId }, false);
               const voiceToken = token ?? (await this.waitForVoiceToken());

               if (!voiceToken) throw new Error("Couldn't get a token for voice");

               await this.voice.signaling.connect(voiceToken, channelId, guildId);

               // Wait for ready
               await new Promise<void>((r) => {
                  const unlisten = this.voice.listen("status_changed", (d) => {
                     if (d === "ready") {
                        unlisten();
                        r();
                     }
                  });
               });
            } finally {
               this.isConnecting = false;
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public async disconnectVoice(): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceManager.disconnectVoice", async (span): Promise<void> => {
         span.setAttributes(this.getDefaultAttributes());

         this.voice.signaling.close();
         this.voiceToken = null;
         this.isConnecting = false;

         await this.voiceState.updateGatewayVoiceState({ channelId: null, guildId: null });
      });
   }

   public async applyVoiceState(): Promise<void> {
      // return await analytics.startActiveSpan("apiVoiceManager.applyVoiceState", async (span): Promise<void> => {
      // span.setAttributes(this.getDefaultAttributes());
      await this.voice.transport.applyVoiceState(this.voiceState.gatewayVoiceState, this.voiceState.localVoiceState, this.voiceState.voicePreferences);
      // });
   }
}
