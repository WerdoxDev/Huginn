import { analytics, EventEmitter, recordSpanError, type GatewayVoiceStateFlags, type LocalVoiceState } from "@huginn/shared";

type Events = {
   update_gateway_voice_state: {
      voiceState: GatewayVoiceStateFlags;
      callback: (flags: GatewayVoiceStateFlags | undefined) => void;
   };
   gateway_voice_state_updated: GatewayVoiceStateFlags;
   local_voice_state_updated: LocalVoiceState;
};

export class VoiceState extends EventEmitter<Events> {
   public gatewayVoiceState: GatewayVoiceStateFlags = {
      isAudioDeafened: false,
      isAudioMuted: false,
      isCameraOn: false,
      isScreenSharing: false,
      isAudioStreaming: false,
   };
   private pendingGatewayVoiceState?: GatewayVoiceStateFlags;

   public localVoiceState: LocalVoiceState = { isAudioPaused: false };

   public async updateGatewayVoiceState(update: Partial<GatewayVoiceStateFlags>): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceState.updateGatewayVoiceState", async (span) => {
         const final = { ...this.gatewayVoiceState, ...update };
         span.setAttributes({
            "voice.state.is_audio_deafened": final.isAudioDeafened,
            "voice.state.is_audio_muted": final.isAudioMuted,
            "voice.state.is_camera_on": final.isCameraOn,
            "voice.state.is_screen_sharing": final.isScreenSharing,
            "voice.state.is_audio_streaming": final.isAudioStreaming,
         });

         try {
            // If the provided update is the same as the current state, ignore
            if (JSON.stringify(final) === JSON.stringify(this.gatewayVoiceState)) {
               span.setAttribute("voice.state.update_ignored", true);
               return;
            }

            this.pendingGatewayVoiceState = { ...this.gatewayVoiceState };
            this.gatewayVoiceState = { ...this.gatewayVoiceState, ...update };

            this.emit("gateway_voice_state_updated", this.gatewayVoiceState);

            const confirmed = await new Promise<GatewayVoiceStateFlags | undefined>((r) => {
               this.emit("update_gateway_voice_state", {
                  voiceState: this.gatewayVoiceState,
                  callback: r,
               });
            });

            if (!confirmed) return;

            this.gatewayVoiceState = { ...confirmed };
            this.pendingGatewayVoiceState = undefined;

            this.emit("gateway_voice_state_updated", this.gatewayVoiceState);

            if (JSON.stringify(confirmed) !== JSON.stringify(this.gatewayVoiceState)) {
               throw new Error("Confirmed gateway voice state does not match local state");
            }
         } catch (e) {
            recordSpanError(e as Error);
            throw e;
         } finally {
            span.end();
         }
      });
   }

   public updateLocalVoiceState(update: Partial<LocalVoiceState>): void {
      this.localVoiceState = { ...this.localVoiceState, ...update };
      this.emit("local_voice_state_updated", this.localVoiceState);
   }
}
