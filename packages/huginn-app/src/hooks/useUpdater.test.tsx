import type { DownloadBundleProgressEvent } from "@capawesome/capacitor-live-update";

import { clientStore } from "@stores/clientStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useUpdater } from "./useUpdater";

const liveUpdate = vi.hoisted(() => ({
   addListener: vi.fn(),
   getCurrentBundle: vi.fn(),
   downloadBundle: vi.fn(),
   setNextBundle: vi.fn(),
   reload: vi.fn(),
}));

vi.mock("@capawesome/capacitor-live-update", () => ({ LiveUpdate: liveUpdate }));
vi.mock("@capacitor/app", () => ({ App: { getInfo: async () => ({ version: "1.0.0" }) } }));
vi.mock("@stores/windowStore", () => ({ useHuginnWindow: () => ({ environment: "android" }) }));

function renderUpdater() {
   const queryClient = new QueryClient();
   return renderHook(() => useUpdater({}), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
   });
}

function emitProgress(downloadedBytes: number, totalBytes: number) {
   const listener = liveUpdate.addListener.mock.calls[0][1] as (event: DownloadBundleProgressEvent) => void;
   act(() => listener({ bundleId: "next", downloadedBytes, totalBytes, progress: downloadedBytes / totalBytes }));
}

describe("useUpdater Android download progress", () => {
   beforeEach(() => {
      vi.clearAllMocks();
      clientStore.setState({ androidUpdateUrl: "https://updates.example.com" });
      liveUpdate.addListener.mockResolvedValue({ remove: vi.fn() });
      liveUpdate.getCurrentBundle.mockResolvedValue({ bundleId: "installed" });
      liveUpdate.downloadBundle.mockResolvedValue(undefined);
      liveUpdate.setNextBundle.mockResolvedValue(undefined);
      liveUpdate.reload.mockResolvedValue(undefined);
   });

   afterEach(() => {
      vi.unstubAllGlobals();
      clientStore.setState({ androidUpdateUrl: undefined });
   });

   it.each([-1, 0, Number.NaN, Number.POSITIVE_INFINITY])("keeps streaming downloaded bytes when the total is %s", (total) => {
      const { result } = renderUpdater();

      emitProgress(1024, total);
      expect(result.current.downloaded).toBe(1024);
      expect(result.current.contentLength).toBe(0);
      expect(result.current.progress).toBe(0);

      emitProgress(2048, total);
      expect(result.current.downloaded).toBe(2048);
      expect(result.current.progress).toBe(0);
   });

   it("calculates bounded percentages when the total is known", () => {
      const { result } = renderUpdater();

      emitProgress(512, 2048);
      expect(result.current.contentLength).toBe(2048);
      expect(result.current.progress).toBe(25);

      emitProgress(4096, 2048);
      expect(result.current.progress).toBe(100);
   });

   it.each([4096, undefined])("uses manifest size %s when available and marks a completed download as 100%%", async (size) => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ version: "next", filename: "next.zip", size }))));
      let completeDownload!: () => void;
      liveUpdate.downloadBundle.mockImplementation(
         () => new Promise<void>((resolve) => {
            completeDownload = resolve;
         }),
      );
      const { result } = renderUpdater();
      let update!: Promise<void>;
      await act(async () => {
         update = result.current.checkAndDownload();
         await vi.waitFor(() => expect(liveUpdate.downloadBundle).toHaveBeenCalledOnce());
      });

      emitProgress(1024, -1);
      expect(result.current.downloaded).toBe(1024);
      expect(result.current.contentLength).toBe(size ?? 0);
      expect(result.current.progress).toBe(size ? 25 : 0);

      emitProgress(4096, -1);
      await act(async () => {
         completeDownload();
         await update;
      });
      expect(result.current.progress).toBe(100);
      expect(result.current.contentLength).toBe(4096);
      expect(result.current.downloaded).toBe(4096);
      expect(liveUpdate.setNextBundle).toHaveBeenCalledWith({ bundleId: "next" });
      expect(liveUpdate.reload).toHaveBeenCalledOnce();
   });
});
