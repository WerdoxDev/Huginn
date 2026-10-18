import { describe, expect, it, vi } from "vitest";

import { VoiceState } from "../voice-state";

describe("voice state", () => {
   it("shows optimistic changes immediately and accepts the server's final state", async () => {
      const state = new VoiceState();
      const request = vi.fn();
      state.on("update_gateway_voice_state", request);
      const pending = state.updateGatewayVoiceState({ isAudioMuted: true });

      expect(state.gatewayVoiceState.isAudioMuted).toBe(true);
      const update = request.mock.calls[0][0];
      expect(update.voiceState).toMatchObject({ isAudioMuted: true });
      expect(update.voiceState).not.toHaveProperty("sessionId");
      update.callback();
      await pending;

      state.confirmGatewayVoiceState({ ...state.gatewayVoiceState, channelId: "channel", isAudioMuted: false });
      expect(state.gatewayVoiceState).toMatchObject({ channelId: "channel", isAudioMuted: false });
   });

   it("keeps an optimistic selection if sending it fails", async () => {
      const state = new VoiceState();
      state.on("update_gateway_voice_state", ({ errback }) => errback?.(new Error("offline")));

      await expect(state.updateGatewayVoiceState({ isAudioMuted: true })).resolves.toBeUndefined();
      expect(state.gatewayVoiceState.isAudioMuted).toBe(true);
   });

   it("rejects a failed confirmed update without changing the selected state", async () => {
      const state = new VoiceState();
      state.on("update_gateway_voice_state", ({ errback }) => errback?.(new Error("offline")));

      await expect(state.updateGatewayVoiceState({ channelId: "channel" }, false)).rejects.toThrow("offline");
      expect(state.gatewayVoiceState.channelId).toBeNull();
   });

   it("preserves mute and deafen selections after leaving a channel", () => {
      const state = new VoiceState();
      state.confirmGatewayVoiceState({ ...state.gatewayVoiceState, channelId: "channel", isAudioMuted: true, isAudioDeafened: true });

      state.confirmGatewayVoiceState({ ...state.gatewayVoiceState, channelId: null, isAudioMuted: false, isAudioDeafened: false });

      expect(state.gatewayVoiceState).toMatchObject({ channelId: null, isAudioMuted: true, isAudioDeafened: true });
   });

   it("resends the selected state after reconnecting", async () => {
      const state = new VoiceState();
      state.confirmGatewayVoiceState({ ...state.gatewayVoiceState, channelId: "channel", isCameraOn: true });
      const request = vi.fn(({ callback }) => callback());
      state.on("update_gateway_voice_state", request);

      await state.resendGatewayVoiceState();

      expect(request).toHaveBeenCalledWith(expect.objectContaining({ voiceState: expect.objectContaining({ channelId: "channel", isCameraOn: true }) }));
   });
});
