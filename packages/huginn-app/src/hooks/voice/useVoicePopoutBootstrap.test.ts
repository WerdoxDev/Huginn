import * as childWindow from "@lib/child-window";
import { VoiceClient } from "@lib/voice/voice-client";
import * as clientStore from "@stores/clientStore";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { useVoicePopoutBootstrap } from "./useVoicePopoutBootstrap";

afterEach(() => vi.restoreAllMocks());

function mockDisconnectedHost() {
   vi.spyOn(childWindow, "isChildWindow").mockReturnValue(true);
   vi.spyOn(VoiceClient, "configure").mockImplementation(() => {});
   vi.spyOn(VoiceClient, "sendMessage").mockResolvedValue({
      hostId: "host",
      status: "disconnected",
      connection: null,
      mediaSources: [],
      popoutState: { isPopoutOpen: false, openMediaPopoutProducers: [] },
   });
   return vi.spyOn(clientStore, "initializeClient").mockResolvedValue(undefined);
}

test("an overlay can bootstrap before the host joins voice", async () => {
   const initializeClient = mockDisconnectedHost();
   const { result } = renderHook(() => useVoicePopoutBootstrap({ allowDisconnected: true }));

   await waitFor(() => expect(result.current.isReady).toBe(true));
   expect(result.current).toEqual({ channelId: null, error: null, isReady: true });
   expect(initializeClient).toHaveBeenCalledOnce();
});

test("a voice popout still requires an active voice connection", async () => {
   const initializeClient = mockDisconnectedHost();
   const { result } = renderHook(() => useVoicePopoutBootstrap());

   await waitFor(() => expect(result.current.isReady).toBe(true));
   expect(result.current.error).toBe("The host window is not connected to voice");
   expect(initializeClient).not.toHaveBeenCalled();
});
