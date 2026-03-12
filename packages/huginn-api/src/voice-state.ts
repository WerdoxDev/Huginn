import { error, EventEmitter, log, type GatewayVoiceStateFlags, type LocalVoiceState } from "@huginn/shared";

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
      log("api:gateway-voice", "default", "update gateway voice state", "upd:", JSON.stringify(update));

      const final = { ...this.gatewayVoiceState, ...update };

      // If the provided update is the same as the current state, ignore
      if (JSON.stringify(final) === JSON.stringify(this.gatewayVoiceState)) {
         log("api:gateway-voice", "default", "ignoring gateway voice state update");
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

      if (!confirmed) {
         return;
      }

      this.gatewayVoiceState = { ...confirmed };
      this.pendingGatewayVoiceState = undefined;

      this.emit("gateway_voice_state_updated", this.gatewayVoiceState);

      if (JSON.stringify(confirmed) !== JSON.stringify(this.gatewayVoiceState)) {
         error(
            "api:gateway-voice",
            "Mismatch between server and local voice state",
            "lvs:",
            JSON.stringify(this.gatewayVoiceState),
            "gvs:",
            JSON.stringify(confirmed),
         );
         return;
      }
   }

   public updateLocalVoiceState(update: Partial<LocalVoiceState>): void {
      this.localVoiceState = { ...this.localVoiceState, ...update };
      this.emit("local_voice_state_updated", this.localVoiceState);
   }
}
