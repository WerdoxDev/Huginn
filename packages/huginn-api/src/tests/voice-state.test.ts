import { beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceState } from "../voice-state";

let voiceState: VoiceState;

beforeEach(() => {
   vi.restoreAllMocks();
   voiceState = new VoiceState();
});

describe("VoiceState", () => {
   it("starts with the default gateway and local voice state", () => {
      expect(voiceState.gatewayVoiceState).toEqual({
         isAudioDeafened: false,
         isAudioMuted: false,
         isCameraOn: false,
         isScreenSharing: false,
         isAudioStreaming: false,
      });
      expect(voiceState.localVoiceState).toEqual({ isAudioPaused: false });
   });

   it("ignores a no-op gateway update", async () => {
      const gatewayUpdated = vi.fn();
      const updateGatewayVoiceState = vi.fn();
      voiceState.on("gateway_voice_state_updated", gatewayUpdated);
      voiceState.on("update_gateway_voice_state", updateGatewayVoiceState);

      await voiceState.updateGatewayVoiceState({ isAudioMuted: false });

      expect(gatewayUpdated).not.toHaveBeenCalled();
      expect(updateGatewayVoiceState).not.toHaveBeenCalled();
      expect(voiceState.gatewayVoiceState).toEqual({
         isAudioDeafened: false,
         isAudioMuted: false,
         isCameraOn: false,
         isScreenSharing: false,
         isAudioStreaming: false,
      });
   });

   it("emits the local state immediately and then confirms a gateway update", async () => {
      const gatewayUpdated = vi.fn();
      const updateGatewayVoiceState = vi.fn(({ voiceState: nextState, callback }) => {
         expect(nextState).toMatchObject({ isCameraOn: true, isAudioMuted: true });
         callback({ ...nextState, isAudioMuted: true });
      });
      voiceState.on("gateway_voice_state_updated", gatewayUpdated);
      voiceState.on("update_gateway_voice_state", updateGatewayVoiceState);

      await voiceState.updateGatewayVoiceState({ isCameraOn: true, isAudioMuted: true });

      expect(updateGatewayVoiceState).toHaveBeenCalledTimes(1);
      expect(gatewayUpdated).toHaveBeenCalledTimes(2);
      expect(gatewayUpdated).toHaveBeenNthCalledWith(1, {
         isAudioDeafened: false,
         isAudioMuted: true,
         isCameraOn: true,
         isScreenSharing: false,
         isAudioStreaming: false,
      });
      expect(gatewayUpdated).toHaveBeenNthCalledWith(2, {
         isAudioDeafened: false,
         isAudioMuted: true,
         isCameraOn: true,
         isScreenSharing: false,
         isAudioStreaming: false,
      });
      expect(voiceState.gatewayVoiceState).toEqual({
         isAudioDeafened: false,
         isAudioMuted: true,
         isCameraOn: true,
         isScreenSharing: false,
         isAudioStreaming: false,
      });
   });

   it("keeps the optimistic state when confirmation is missing", async () => {
      const gatewayUpdated = vi.fn();
      voiceState.on("gateway_voice_state_updated", gatewayUpdated);
      voiceState.on("update_gateway_voice_state", ({ callback }) => callback(undefined));

      await voiceState.updateGatewayVoiceState({ isScreenSharing: true });

      expect(gatewayUpdated).toHaveBeenCalledTimes(1);
      expect(gatewayUpdated).toHaveBeenCalledWith({
         isAudioDeafened: false,
         isAudioMuted: false,
         isCameraOn: false,
         isScreenSharing: true,
         isAudioStreaming: false,
      });
      expect(voiceState.gatewayVoiceState).toEqual({
         isAudioDeafened: false,
         isAudioMuted: false,
         isCameraOn: false,
         isScreenSharing: true,
         isAudioStreaming: false,
      });
   });

   it("merges and emits local voice state updates", () => {
      const localUpdated = vi.fn();
      voiceState.on("local_voice_state_updated", localUpdated);

      voiceState.updateLocalVoiceState({ isAudioPaused: true });

      expect(localUpdated).toHaveBeenCalledTimes(1);
      expect(localUpdated).toHaveBeenCalledWith({ isAudioPaused: true });
      expect(voiceState.localVoiceState).toEqual({ isAudioPaused: true });
   });
});
