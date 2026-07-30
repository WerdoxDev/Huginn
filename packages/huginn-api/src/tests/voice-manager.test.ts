import { EventEmitter, type GatewayVoiceStateFlags, type Snowflake } from "@huginnjs/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VoiceConnectionData, VoiceStatus } from "../types";

import { VoiceManager } from "../voice-manager";

class TestGateway extends EventEmitter<Record<string, unknown>> {
   public status = "authenticated";
   public user = { id: "user-me" };

   public updateVoiceState = vi.fn(async (voiceState: GatewayVoiceStateFlags, _channelId: Snowflake, _guildId: Snowflake | null) => {
      return voiceState;
   });

   public getVoiceToken = vi.fn(async () => "voice-token");
   public sendDefaultVoiceState = vi.fn(async () => undefined);
}

class TestSignaling extends EventEmitter<Record<string, unknown>> {
   public status = "authenticated";
   public connectionData?: VoiceConnectionData;

   public checkStatus = vi.fn(() => {
      if (this.status !== "authenticated" && this.status !== "resuming") {
         throw new Error(`Voice signaling is not ready: ${this.status}`);
      }
   });

   public close = vi.fn(() => {
      this.status = "idle";
   });

   public connect = vi.fn((token: string, channelId: Snowflake, guildId: Snowflake | null) => {
      this.connectionData = { token, channelId, guildId };
      this.status = "connecting";
   });
}

class TestTransport extends EventEmitter<Record<string, unknown>> {
   public applyVoiceState = vi.fn();
   public producers = new Map<string, { appData: { mediaKind: string } }>();

   public getProducer = vi.fn((kind: string) => this.producers.get(kind));
}

class TestVoice extends EventEmitter<Record<string, unknown>> {
   public status: VoiceStatus = "ready";
   public signaling = new TestSignaling();
   public transport = new TestTransport();

   public listen(event: string, listener: (...args: any[]) => void): () => void {
      this.on(event, listener);
      return () => this.off(event, listener);
   }

   public setStatus(status: VoiceStatus): void {
      this.status = status;
      this.emit("status_changed", status);
   }
}

let gateway: TestGateway;
let voice: TestVoice;
let manager: VoiceManager;

beforeEach(() => {
   vi.restoreAllMocks();
   gateway = new TestGateway();
   voice = new TestVoice();
   manager = new VoiceManager(gateway as any, voice as any);
});

describe("constructor wiring", () => {
   it("replays the current voice state on gateway reconnect when the voice is ready", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-9",
         guildId: "guild-7",
      };
      voice.status = "ready";

      gateway.emit("reconnected", undefined);

      await vi.waitFor(() => expect(gateway.updateVoiceState).toHaveBeenCalledTimes(1));
      expect(voice.signaling.checkStatus).toHaveBeenCalledTimes(1);
      expect(gateway.updateVoiceState).toHaveBeenCalledWith(manager.voiceState.gatewayVoiceState, "channel-9", "guild-7");
   });

   it("does nothing on gateway reconnect when the voice is not ready", async () => {
      voice.status = "signaling";

      gateway.emit("reconnected", undefined);

      await vi.waitFor(() => expect(gateway.updateVoiceState).not.toHaveBeenCalled());
      expect(voice.signaling.checkStatus).not.toHaveBeenCalled();
   });
});

describe("voice state synchronization", () => {
   it("persists a confirmed gateway voice state and applies it to the transport", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-2",
         guildId: null,
      };

      await manager.voiceState.updateGatewayVoiceState({ isCameraOn: true });

      await vi.waitFor(() => expect(gateway.updateVoiceState).toHaveBeenCalledTimes(1));
      expect(gateway.updateVoiceState).toHaveBeenCalledWith(expect.objectContaining({ isCameraOn: true }), "channel-2", null);
      expect(manager.voiceState.gatewayVoiceState.isCameraOn).toBe(true);
      expect(voice.transport.applyVoiceState).toHaveBeenCalled();
      expect(voice.transport.applyVoiceState).toHaveBeenLastCalledWith(manager.voiceState.gatewayVoiceState, manager.voiceState.localVoiceState);
   });

   it("falls back to the requested gateway voice state when confirmation fails", async () => {
      voice.signaling.status = "idle";

      await manager.voiceState.updateGatewayVoiceState({ isAudioMuted: true });

      expect(gateway.updateVoiceState).not.toHaveBeenCalled();
      expect(manager.voiceState.gatewayVoiceState.isAudioMuted).toBe(true);
      expect(voice.transport.applyVoiceState).toHaveBeenCalled();
   });

   it("applies gateway and local voice state changes to the transport", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-3",
         guildId: "guild-3",
      };

      await manager.voiceState.updateGatewayVoiceState({ isAudioDeafened: true });
      voice.transport.applyVoiceState.mockClear();

      manager.voiceState.updateLocalVoiceState({ isAudioPaused: true });

      await vi.waitFor(() => expect(voice.transport.applyVoiceState).toHaveBeenCalled());
      expect(voice.transport.applyVoiceState).toHaveBeenLastCalledWith(manager.voiceState.gatewayVoiceState, manager.voiceState.localVoiceState);
      expect(manager.voiceState.localVoiceState.isAudioPaused).toBe(true);
   });
});

describe("transport event reactions", () => {
   it("turns on streaming and screen-share flags when matching producers are created", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-4",
         guildId: "guild-4",
      };

      voice.transport.producers.set("stream_video", { appData: { mediaKind: "stream_video" } });

      voice.transport.emit("producer_created", { appData: { mediaKind: "stream_audio" } });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isAudioStreaming).toBe(false));

      voice.transport.producers.delete("stream_video");
      voice.transport.emit("producer_created", { appData: { mediaKind: "stream_audio" } });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isAudioStreaming).toBe(true));

      voice.transport.emit("producer_created", { appData: { mediaKind: "stream_video" } });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isScreenSharing).toBe(true));

      voice.transport.emit("producer_created", { appData: { mediaKind: "camera" } });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isCameraOn).toBe(true));
   });

   it("turns flags off when matching producers are closed", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-5",
         guildId: "guild-5",
      };

      await manager.voiceState.updateGatewayVoiceState({ isAudioStreaming: true, isScreenSharing: true, isCameraOn: true });

      voice.transport.emit("producer_closed", { kind: "stream_audio" });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isAudioStreaming).toBe(false));

      voice.transport.emit("producer_closed", { kind: "stream_video" });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isScreenSharing).toBe(false));

      voice.transport.emit("producer_closed", { kind: "camera" });
      await vi.waitFor(() => expect(manager.voiceState.gatewayVoiceState.isCameraOn).toBe(false));
   });

   it("skips turning off audio streaming when it is already false", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-5b",
         guildId: "guild-5b",
      };

      voice.transport.emit("producer_closed", { kind: "stream_audio" });

      await vi.waitFor(() => expect(gateway.updateVoiceState).not.toHaveBeenCalled());
   });

   it("resets the gateway voice state when the transport resets", async () => {
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-6",
         guildId: "guild-6",
      };

      await manager.voiceState.updateGatewayVoiceState({ isAudioStreaming: true, isScreenSharing: true, isCameraOn: true });

      voice.transport.emit("reset", undefined);

      await vi.waitFor(() => {
         expect(manager.voiceState.gatewayVoiceState.isAudioStreaming).toBe(false);
         expect(manager.voiceState.gatewayVoiceState.isScreenSharing).toBe(false);
         expect(manager.voiceState.gatewayVoiceState.isCameraOn).toBe(false);
      });
   });
});

describe("connectVoice", () => {
   it("throws when the gateway is not authenticated", async () => {
      gateway.status = "disconnected";

      await expect(manager.connectVoice(null, "channel-7")).rejects.toThrow("Gateway is not in the correct state: disconnected");
   });

   it("throws when a connection is already in flight", async () => {
      (manager as any).isConnecting = true;

      await expect(manager.connectVoice(null, "channel-8")).rejects.toThrow("Already trying to connect to a voice channel");
   });

   it("throws when connecting to the same voice channel", async () => {
      voice.signaling.connectionData = {
         token: "existing-token",
         channelId: "channel-9",
         guildId: "guild-9",
      };

      await expect(manager.connectVoice("guild-9", "channel-9")).rejects.toThrow("Already connected to the same voice channel");
   });

   it("uses the provided token, closes an active signaling session, and waits for ready", async () => {
      voice.status = "ready";
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = {
         token: "old-token",
         channelId: "channel-old",
         guildId: "guild-old",
      };

      const connectPromise = manager.connectVoice("guild-10", "channel-10", "provided-token");

      await vi.waitFor(() => expect(voice.signaling.connect).toHaveBeenCalledWith("provided-token", "channel-10", "guild-10"));
      expect(voice.signaling.close).toHaveBeenCalledTimes(1);
      expect(gateway.getVoiceToken).not.toHaveBeenCalled();

      voice.setStatus("connecting");
      voice.setStatus("ready");
      await expect(connectPromise).resolves.toBeUndefined();
   });

   it("fetches a voice token from the gateway when one is not supplied", async () => {
      voice.status = "idle";
      voice.signaling.status = "authenticated";
      voice.signaling.connectionData = undefined as any;

      const connectPromise = manager.connectVoice("guild-11", "channel-11");

      await vi.waitFor(() => expect(gateway.getVoiceToken).toHaveBeenCalledWith("guild-11", "channel-11", manager.voiceState.gatewayVoiceState));
      await vi.waitFor(() => expect(voice.signaling.connect).toHaveBeenCalledWith("voice-token", "channel-11", "guild-11"));

      voice.setStatus("ready");
      await expect(connectPromise).resolves.toBeUndefined();
   });

   it("throws when the gateway cannot provide a voice token", async () => {
      gateway.getVoiceToken.mockResolvedValueOnce(null as any);

      await expect(manager.connectVoice("guild-12", "channel-12")).rejects.toThrow("Couldn't get a token for voice");
   });
});

describe("disconnectVoice", () => {
   it("sends the default voice state and closes signaling", async () => {
      gateway.user = undefined as any;
      (manager as any).isConnecting = true;

      await manager.disconnectVoice();

      expect(gateway.sendDefaultVoiceState).toHaveBeenCalledTimes(1);
      expect(voice.signaling.close).toHaveBeenCalledTimes(1);
      expect((manager as any).isConnecting).toBe(false);
   });

   it("rethrows when the gateway fails to send the default voice state", async () => {
      gateway.sendDefaultVoiceState.mockRejectedValueOnce(new Error("default state failed"));

      await expect(manager.disconnectVoice()).rejects.toThrow("default state failed");
      expect(voice.signaling.close).not.toHaveBeenCalled();
   });
});
