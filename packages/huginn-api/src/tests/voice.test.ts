import { VoiceSignallingErrorCode } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { audioTrack, createVoiceSession, installVoiceEnvironment, videoTrack } from "./voice-test-utils";

let session: ReturnType<typeof createVoiceSession>;
beforeEach(() => {
   installVoiceEnvironment();
   session = createVoiceSession();
});
afterEach(() => {
   session.voice.signaling.close();
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

describe("voice call lifecycle", () => {
   it("joins a channel, publishes media, and releases it on leaving", async () => {
      const { voice, manager } = session;
      await manager.connectVoice(null, "channel");
      expect(voice.status).toBe("ready");

      const track = audioTrack();
      await voice.device.openMicrophone(track);
      const microphone = voice.transport.getProducer("microphone")!;
      expect(microphone.track).toBe(track);
      await voice.device.openCamera(videoTrack());
      expect(manager.voiceState.gatewayVoiceState.isCameraOn).toBe(true);

      await manager.disconnectVoice();
      expect(voice.status).toBe("idle");
      expect(microphone.closed).toBe(true);
      expect(voice.transport.getProducers()).toEqual([]);
      expect(manager.voiceState.gatewayVoiceState.channelId).toBeNull();
   });

   it("discovers participants already publishing when joining", async () => {
      const { voice, server, manager } = session;
      const remote = { producerId: "already-publishing", kind: "microphone", userId: "remote-user" } as const;
      server.producers.push(remote);

      await manager.connectVoice(null, "channel");
      const received = await voice.transport.createConsumer(remote.userId, remote.kind);

      expect(voice.transport.getRemoteProducers()).toContainEqual(remote);
      expect(received.track.kind).toBe("audio");
   });

   it("reports transport setup failure to the caller and leaves the channel", async () => {
      const { voice, server, manager } = session;
      server.errors.set("create_transport", VoiceSignallingErrorCode.UNKNOWN_ERROR);

      await expect(manager.connectVoice(null, "channel")).rejects.toThrow(/transport failed/);

      expect(voice.status).toBe("idle");
      expect(manager.voiceState.gatewayVoiceState.channelId).toBeNull();
   });

   it("rolls back the screen-sharing flag if the server rejects publishing", async () => {
      const { voice, server, manager } = session;
      await manager.connectVoice(null, "channel");
      server.errors.set("produce", VoiceSignallingErrorCode.WRONG_STATE);

      await expect(voice.stream.openStream(videoTrack())).rejects.toThrow();

      expect(manager.voiceState.gatewayVoiceState.isScreenSharing).toBe(false);
      expect(voice.transport.getProducer("stream_video")).toBeUndefined();
   });

   it.each(["producer_closed", "peer_left"] as const)("stops receiving a departed participant's media on %s", async (event) => {
      const { voice, server, manager } = session;
      await manager.connectVoice(null, "channel");
      const remote = server.addProducer();
      const consumer = await voice.transport.createConsumer(remote.userId, remote.kind);

      server.socket.dispatch(event, event === "producer_closed" ? remote : { userId: remote.userId, producerIds: [remote.producerId], consumerIds: [] });

      await vi.waitFor(() => expect(consumer.closed).toBe(true));
      expect(voice.transport.getConsumers()).toEqual([]);
      expect(voice.transport.getRemoteProducers()).toEqual([]);
   });
});
