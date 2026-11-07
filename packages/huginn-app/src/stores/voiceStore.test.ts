import type { GatewayUpdateVoiceStateData } from "@huginnjs/shared";

import { HuginnClient, type Gateway } from "@huginnjs/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clientStore } from "./clientStoreState";
import { storageStore } from "./storageStore";
import { initVoiceStore, voiceStore } from "./voiceStore";

let state: HuginnClient["voiceManager"]["voiceState"];
let gateway: Gateway;
let updates: GatewayUpdateVoiceStateData[];
let dispose: (() => void) | undefined;

beforeEach(() => {
   const client = new HuginnClient();
   state = client.voiceManager.voiceState;
   gateway = client.gateway;
   vi.spyOn(gateway, "updateVoiceState").mockImplementation(async (flags, channelId, guildId) => ({
      ...state.gatewayVoiceState,
      ...flags,
      channelId,
      guildId,
   }));
   updates = [];
   state.on("update_gateway_voice_state", ({ voiceState }) => {
      updates.push(voiceState);
   });
   clientStore.setState({
      client: client as NonNullable<ReturnType<typeof clientStore.getState>["client"]>,
   });
   voiceStore.setState({ voiceStates: [] });
});

afterEach(() => {
   dispose?.();
   dispose = undefined;
   clientStore.setState({ client: undefined });
   vi.restoreAllMocks();
});

describe("camera inversion voice state", () => {
   it("loads the saved selection before joining a call", async () => {
      await storageStore.getState().updateSettings({ isCameraInverted: true });

      dispose = await initVoiceStore();

      expect(state.gatewayVoiceState.isCameraInverted).toBe(true);
      expect(voiceStore.getState().voiceState.isCameraInverted).toBe(true);
      expect(updates.at(-1)?.isCameraInverted).toBe(true);
   });

   it("publishes both enabling and disabling inversion during a call", async () => {
      state.gatewayVoiceState.channelId = "channel";
      dispose = await initVoiceStore();
      updates.length = 0;

      for (const isCameraInverted of [true, false]) {
         await storageStore.getState().updateSettings({ isCameraInverted });

         expect(updates.at(-1)).toMatchObject({ channelId: "channel", isCameraInverted });
         expect(gateway.updateVoiceState).toHaveBeenLastCalledWith(expect.objectContaining({ isCameraInverted }), "channel", null);
         expect(voiceStore.getState().voiceState.isCameraInverted).toBe(isCameraInverted);
      }
      expect(updates).toHaveLength(2);
   });

   it("retains another user's inversion flag received through the gateway", async () => {
      dispose = await initVoiceStore();
      const remoteState = { ...state.gatewayVoiceState, userId: "remote", channelId: "channel", isCameraOn: true, isCameraInverted: true };

      gateway.emit("voice_state_update", remoteState);

      expect(voiceStore.getState().voiceStates).toContainEqual(remoteState);
      gateway.emit("voice_state_update", { ...remoteState, isCameraInverted: false });
      expect(voiceStore.getState().voiceStates).toContainEqual({ ...remoteState, isCameraInverted: false });
   });

   it("stops publishing settings changes after disposal", async () => {
      dispose = await initVoiceStore();
      dispose?.();
      dispose = undefined;
      updates.length = 0;

      await storageStore.getState().updateSettings({ isCameraInverted: true });

      expect(updates).toHaveLength(0);
   });
});
