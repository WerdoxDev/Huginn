import { afterEach, expect, test, vi } from "vitest";
import { createStore } from "zustand";

import * as childWindow from "./child-window";
import { syncZustandStore } from "./sync-zustand";

afterEach(() => {
   vi.restoreAllMocks();
   vi.unstubAllGlobals();
});

function createChannel(isChild: boolean) {
   vi.spyOn(childWindow, "isChildWindow").mockReturnValue(isChild);
   vi.spyOn(childWindow, "getHostId").mockReturnValue("voice-host");
   const channel = { postMessage: vi.fn(), close: vi.fn(), onmessage: null as null | ((event: { data: unknown }) => void) };
   const BroadcastChannel = vi.fn(function () {
      return channel;
   });
   vi.stubGlobal("BroadcastChannel", BroadcastChannel);
   return { channel, BroadcastChannel };
}

test("an overlay requests and follows host state without publishing its own changes", () => {
   const { channel, BroadcastChannel } = createChannel(true);
   const action = vi.fn();
   const store = createStore(() => ({ speaking: false, action }));
   const stop = syncZustandStore(store, { name: "voice", partialize: ({ speaking }) => ({ speaking }) });

   expect(BroadcastChannel).toHaveBeenCalledWith("zustand:voice-host:voice");
   expect(channel.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "request-state", source: expect.any(String) });

   channel.onmessage!({ data: { type: "state", source: "main", state: { speaking: true } } });
   expect(store.getState()).toEqual({ speaking: true, action });

   store.setState({ speaking: false });
   expect(channel.postMessage).toHaveBeenCalledOnce();
   stop();
   expect(channel.close).toHaveBeenCalledOnce();
});

test("the main window remains the sole state publisher", () => {
   const { channel } = createChannel(false);
   const store = createStore(() => ({ speaking: false }));
   const stop = syncZustandStore(store, { name: "voice", partialize: (state) => state });

   channel.onmessage!({ data: { type: "state", source: "overlay", state: { speaking: true } } });
   expect(store.getState().speaking).toBe(false);

   store.setState({ speaking: true });
   expect(channel.postMessage).toHaveBeenCalledExactlyOnceWith({ type: "state", source: expect.any(String), state: { speaking: true } });
   stop();
});
