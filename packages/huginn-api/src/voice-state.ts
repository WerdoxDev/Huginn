import { analytics, EventEmitter, type GatewayVoiceStateFlags, type LocalVoiceState, type VoicePreference } from "@huginn/shared";

type Events = {
   update_gateway_voice_state: {
      voiceState: GatewayVoiceStateFlags;
      callback: () => void;
      errback?: (e: unknown) => void;
   };
   gateway_voice_state_updated: GatewayVoiceStateFlags;
   local_voice_state_updated: LocalVoiceState;
   voice_preferences_updated: VoicePreference[];
};

export class VoiceState extends EventEmitter<Events> {
   public gatewayVoiceState: GatewayVoiceStateFlags = {
      isAudioDeafened: false,
      isAudioMuted: false,
      isCameraOn: false,
      isScreenSharing: false,
      isAudioStreaming: false,
   };

   public localVoiceState: LocalVoiceState = { isAudioPaused: false };
   public voicePreferences: VoicePreference[] = [];

   public async updateGatewayVoiceState(update: Partial<GatewayVoiceStateFlags>, optimistic: boolean = true): Promise<void> {
      return await analytics.startActiveSpan("apiVoiceState.updateGatewayVoiceState", async (span) => {
         const newState = { ...this.gatewayVoiceState, ...update };

         span.setAttributes({
            "voice.state.is_audio_deafened": newState.isAudioDeafened,
            "voice.state.is_audio_muted": newState.isAudioMuted,
            "voice.state.is_camera_on": newState.isCameraOn,
            "voice.state.is_screen_sharing": newState.isScreenSharing,
            "voice.state.is_audio_streaming": newState.isAudioStreaming,
         });

         // If the provided update is the same as the current state, ignore
         if (JSON.stringify(newState) === JSON.stringify(this.gatewayVoiceState)) {
            span.setAttribute("voice.state.update_ignored", true);
            return;
         }

         if (optimistic) {
            this.gatewayVoiceState = newState;
            this.emit("gateway_voice_state_updated", this.gatewayVoiceState);
         }

         await new Promise<void>((res, rej) => {
            this.emit("update_gateway_voice_state", {
               voiceState: newState,
               callback: res,
               errback: () => (optimistic ? res() : rej()), // When optimistic is true, we don't want to reject the promise if the update fails, since we've already updated the state optimistically
            });
         });
      });
   }

   public confirmGatewayVoiceState(confirmed: GatewayVoiceStateFlags): void {
      this.gatewayVoiceState = { ...confirmed };
      this.emit("gateway_voice_state_updated", this.gatewayVoiceState);
   }

   public updateLocalVoiceState(update: Partial<LocalVoiceState>): void {
      this.localVoiceState = { ...this.localVoiceState, ...update };
      this.emit("local_voice_state_updated", this.localVoiceState);
   }

   public updateVoicePreferences(preferences: VoicePreference[]): void {
      this.voicePreferences = preferences;
      this.emit("voice_preferences_updated", this.voicePreferences);
   }
}
