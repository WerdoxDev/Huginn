import type { VoicePreference } from "@huginnjs/shared";

import { VoiceOperations } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { audioTrack, createVoiceSession, installVoiceEnvironment } from "./voice-test-utils";

let session: ReturnType<typeof createVoiceSession>;
beforeEach(() => {
   installVoiceEnvironment();
   session = createVoiceSession();
});
afterEach(() => {
   session.voice.signaling.close();
   vi.unstubAllGlobals();
});

describe("voice channel management", () => {
   it("uses the gateway token to join the requested channel", async () => {
      const { server, manager } = session;
      await manager.connectVoice("guild", "channel");

      expect(server.messages.find((message) => message.op === VoiceOperations.IDENTIFY)).toMatchObject({
         d: { token: "voice-token", channelId: "channel", guildId: "guild" },
      });
      expect(manager.voiceState.gatewayVoiceState).toMatchObject({ channelId: "channel", guildId: "guild" });
   });

   it("rejects a join until the gateway is authenticated", async () => {
      session.gateway.status = "disconnected";

      await expect(session.manager.connectVoice(null, "channel")).rejects.toThrow(/Gateway/);
      expect(session.server.sockets).toEqual([]);
   });

   it("rejects joining the current channel without interrupting the call", async () => {
      await session.manager.connectVoice(null, "channel");

      await expect(session.manager.connectVoice(null, "channel")).rejects.toThrow(/same voice channel/);
      expect(session.voice.status).toBe("ready");
   });

   it("keeps the microphone paused until both local silence and gateway mute are cleared", async () => {
      const { voice, manager } = session;
      await manager.connectVoice(null, "channel");
      await voice.device.openMicrophone(audioTrack());
      const mic = voice.transport.getProducer("microphone")!;

      manager.voiceState.updateLocalVoiceState({ isAudioPaused: true });
      expect(mic.paused).toBe(true);
      await manager.voiceState.updateGatewayVoiceState({ isAudioMuted: true });
      manager.voiceState.updateLocalVoiceState({ isAudioPaused: false });
      expect(mic.paused).toBe(true);
      await manager.voiceState.updateGatewayVoiceState({ isAudioMuted: false });
      expect(mic.paused).toBe(false);
   });

   it("applies participant mute and deafen preferences to audio while keeping video visible", async () => {
      const { voice, server, manager } = session;
      await manager.connectVoice(null, "channel");
      server.addProducer("microphone");
      server.addProducer("camera");
      const mic = await voice.transport.createConsumer("remote-user", "microphone");
      const camera = await voice.transport.createConsumer("remote-user", "camera");
      const preference: VoicePreference = { userId: "remote-user", microphoneVolume: 100, streamVolume: 100, isMicrophoneMuted: false, isStreamMuted: false };
      manager.voiceState.updateVoicePreferences([preference]);
      await manager.applyVoiceState();
      expect(mic.paused).toBe(false);
      expect(camera.paused).toBe(false);

      manager.voiceState.updateVoicePreferences([{ ...preference, isMicrophoneMuted: true }]);
      await manager.applyVoiceState();
      expect(mic.paused).toBe(true);
      expect(camera.paused).toBe(false);

      manager.voiceState.updateVoicePreferences([preference]);
      await manager.voiceState.updateGatewayVoiceState({ isAudioDeafened: true });
      expect(mic.paused).toBe(true);
      expect(camera.paused).toBe(false);
      await manager.voiceState.updateGatewayVoiceState({ isAudioDeafened: false });
      expect(mic.paused).toBe(false);
   });

   it("ignores another user's or session's confirmation", () => {
      const { gateway, manager } = session;
      gateway.emit("voice_state_update", { userId: "other", sessionId: gateway.sessionId, channelId: "wrong" });
      gateway.emit("voice_state_update", { userId: "user-me", sessionId: "other-session", channelId: "wrong" });

      expect(manager.voiceState.gatewayVoiceState.channelId).toBeNull();
   });
});
