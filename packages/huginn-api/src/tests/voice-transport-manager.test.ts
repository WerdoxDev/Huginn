import { VoiceSignallingErrorCode, VoiceTransportErrorCode } from "@huginnjs/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { audioTrack, createVoiceSession, installVoiceEnvironment } from "./voice-test-utils";

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

describe("media transport", () => {
   beforeEach(async () => {
      await session.manager.connectVoice(null, "channel");
   });

   it("publishes a track and stops publishing when the track ends", async () => {
      const { transport } = session.voice;
      const track = audioTrack();
      const producer = await transport.createProducer("microphone", track);
      expect(transport.getProducer("microphone")).toBe(producer);

      track.dispatchEvent(new Event("ended"));

      await vi.waitFor(() => expect(producer.closed).toBe(true));
      expect(transport.getProducer("microphone")).toBeUndefined();
   });

   it("rejects duplicate media without replacing the active track", async () => {
      const { transport } = session.voice;
      const first = await transport.createProducer("microphone", audioTrack());

      await expect(transport.createProducer("microphone", audioTrack())).rejects.toMatchObject({ code: VoiceTransportErrorCode.PRODUCER_ALREADY_EXISTS });
      expect(transport.getProducer("microphone")).toBe(first);
      expect(first.closed).toBe(false);
   });

   it("keeps a published track available if closing it is rejected", async () => {
      const { voice, server } = session;
      const producer = await voice.transport.createProducer("microphone", audioTrack());
      server.errors.set("close_producer", VoiceSignallingErrorCode.WRONG_STATE);

      await expect(voice.transport.closeProducer("microphone")).rejects.toThrow();
      expect(producer.closed).toBe(false);
      expect(voice.transport.getProducer("microphone")).toBe(producer);
   });

   it("receives remote media paused until playback is selected, then closes it", async () => {
      const { voice, server } = session;
      const remote = server.addProducer();
      const received = await voice.transport.createConsumer(remote.userId, remote.kind);

      expect(received.track.kind).toBe("audio");
      expect(received.paused).toBe(true);
      expect(voice.transport.getConsumer(remote.userId, remote.kind)).toBe(received);

      await voice.transport.closeConsumer(received.id);
      expect(received.closed).toBe(true);
      expect(voice.transport.getConsumers()).toEqual([]);
   });

   it("reports a server refusal without retaining a consumer", async () => {
      const { voice, server } = session;
      const remote = server.addProducer();
      server.errors.set("consume", VoiceSignallingErrorCode.WRONG_STATE);

      await expect(voice.transport.createConsumer(remote.userId, remote.kind)).rejects.toThrow();
      expect(voice.transport.getConsumers()).toEqual([]);
   });

   it("does not retain a consumer if its producer leaves during subscription", async () => {
      const { voice, server } = session;
      const remote = server.addProducer();
      server.autoReply = false;
      const pending = voice.transport.createConsumer(remote.userId, remote.kind);
      const rejected = expect(pending).rejects.toMatchObject({ code: VoiceTransportErrorCode.REMOTE_PRODUCER_DELETED });
      await vi.waitFor(() => expect(server.sent("consume")).toHaveLength(1));

      server.socket.dispatch("producer_closed", remote);
      server.autoReply = true;
      server.respond(server.socket, server.sent("consume")[0]);

      await rejected;
      expect(voice.transport.getConsumers()).toEqual([]);
   });

   it("reports resume errors to the caller instead of silently accepting them", async () => {
      const { voice, server } = session;
      const remote = server.addProducer();
      const received = await voice.transport.createConsumer(remote.userId, remote.kind);
      server.errors.set("resume_consumer", VoiceSignallingErrorCode.WRONG_STATE);

      await expect(voice.transport.resumeConsumer(received.id)).rejects.toThrow();
      expect(received.paused).toBe(true);
   });

   it("negotiates fresh ICE parameters after the media connection fails", async () => {
      const { voice, server, handlers } = session;
      const [send, receive] = handlers;
      send.setConnectionState("failed");

      await vi.waitFor(() => expect(server.sent("restart_ice").length).toBeGreaterThan(0));
      send.setConnectionState("connected");
      receive.setConnectionState("connected");

      await vi.waitFor(() => expect(voice.status).toBe("ready"));
      expect(server.sent("restart_ice")[0]).toMatchObject({ d: { transportId: voice.transport.sendTransport?.id } });
   });

   it("releases tracks and peer listings when reset", async () => {
      const { voice, server } = session;
      const local = await voice.transport.createProducer("microphone", audioTrack());
      const remote = server.addProducer();
      const received = await voice.transport.createConsumer(remote.userId, remote.kind);

      voice.transport.reset();

      expect(local.closed).toBe(true);
      expect(received.closed).toBe(true);
      expect(voice.transport.getRemoteProducers()).toEqual([]);
      expect(voice.transport.getProducers()).toEqual([]);
      expect(voice.transport.getConsumers()).toEqual([]);
      expect(voice.transport.status).toBe("idle");
   });
});

describe("relay selection", () => {
   it("can connect directly when optional relay credentials are unavailable", async () => {
      vi.mocked(fetch).mockRejectedValue(new Error("relay offline"));

      await session.manager.connectVoice(null, "channel");

      expect(session.voice.status).toBe("ready");
   });

   it("connects with TURN credentials when a relay is required", async () => {
      session.voice.transport.iceTransportPolicy = "relay";

      await session.manager.connectVoice(null, "channel");

      expect(session.voice.status).toBe("ready");
      expect(fetch).toHaveBeenCalledWith("https://voice.test/voice/ice-servers", expect.objectContaining({ headers: { Authorization: "Bearer test-token" } }));
   });

   it.each(["unavailable", "STUN-only"])("fails without falling back to a direct connection for %s relay credentials", async (failure) => {
      session.voice.transport.iceTransportPolicy = "relay";
      if (failure === "unavailable") vi.mocked(fetch).mockRejectedValue(new Error("offline"));
      else vi.mocked(fetch).mockResolvedValue(Response.json({ iceServers: [{ urls: "stun:stun.test" }] }));

      await expect(session.manager.connectVoice(null, "channel")).rejects.toThrow(/relay/i);
      expect(session.voice.transport.sendTransport).toBeUndefined();
      expect(session.voice.status).toBe("idle");
   });
});
