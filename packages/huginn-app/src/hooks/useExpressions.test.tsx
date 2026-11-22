import type { APIExpression, APIExpressionReference, ExpressionKind, GatewayExpressionUpdatedData, RawFile } from "@huginnjs/shared";
import type { PropsWithChildren } from "react";

import { CONSTANTS, EventEmitter, ExpressionType, resolveCdnUrl } from "@huginnjs/shared";
import { focusManager, onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExpressions, useExpressionUpdates } from "./useExpressions";

const mocks = vi.hoisted(() => ({
   gifs: { getAll: vi.fn(), add: vi.fn(), remove: vi.fn(), upload: vi.fn() },
   stickers: { getAll: vi.fn(), add: vi.fn(), remove: vi.fn(), upload: vi.fn() },
   user: { id: "user-1" } as { id: string } | undefined,
   clientAvailable: true,
   showError: vi.fn(),
   fetch: vi.fn<typeof fetch>(),
   gateway: undefined as unknown as EventEmitter<{ expression_update: GatewayExpressionUpdatedData }>,
}));

vi.mock("@stores/clientStore", async (importOriginal) => {
   const client = {
      gifs: mocks.gifs,
      stickers: mocks.stickers,
      get gateway() {
         return mocks.gateway;
      },
      cdn: { asset: (path: string) => resolveCdnUrl(path, "https://cdn.example/cdn") },
   };
   return { ...(await importOriginal<typeof import("@stores/clientStore")>()), useClient: () => (mocks.clientAvailable ? client : undefined) };
});
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ user: mocks.user }) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ showError: mocks.showError }) }));

function expression(overrides: Partial<APIExpression> = {}): APIExpression {
   return {
      id: "cat",
      type: ExpressionType.KLIPY,
      title: "Cat",
      url: "https://klipy.com/gifs/cat",
      src: "https://media.example/cat.gif",
      contentType: "image/gif",
      width: 100,
      height: 100,
      ...overrides,
   };
}

const collections = new Map<string, APIExpression[]>();
const caches: QueryClient[] = [];

function setup(kind: ExpressionKind, items: APIExpression[] = [], isOpen = false) {
   collections.set(`${mocks.user?.id}:${kind}`, items);
   const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
   caches.push(cache);
   const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
   const hook = renderHook(
      ({ kind, isOpen }) => {
         useExpressionUpdates();
         return useExpressions(kind, isOpen);
      },
      { wrapper, initialProps: { kind, isOpen } },
   );
   return { ...hook, rerender: (props: { kind?: ExpressionKind; isOpen?: boolean } = {}) => hook.rerender({ kind, isOpen, ...props }) };
}

beforeEach(() => {
   vi.resetAllMocks();
   mocks.user = { id: "user-1" };
   mocks.clientAvailable = true;
   focusManager.setFocused(true);
   onlineManager.setOnline(true);
   mocks.gateway = new EventEmitter();
   collections.clear();
   vi.stubGlobal("fetch", mocks.fetch);
   for (const kind of ["gifs", "stickers"] as const) {
      const key = () => `${mocks.user?.id}:${kind}`;
      mocks[kind].getAll.mockImplementation(async () => [...(collections.get(key()) ?? [])]);
      mocks[kind].add.mockImplementation(async (ref: APIExpressionReference) => {
         const added = expression(ref);
         collections.set(key(), [...(collections.get(key()) ?? []), added]);
         return added;
      });
      mocks[kind].remove.mockImplementation(async (ref: APIExpressionReference) => {
         collections.set(
            key(),
            (collections.get(key()) ?? []).filter((item) => item.id !== ref.id || item.type !== ref.type),
         );
      });
      mocks[kind].upload.mockImplementation(async (_file: RawFile, body?: { sourceKey?: string }) => {
         const imported = expression({ id: "imported", type: ExpressionType.UPLOADED, sourceKey: body?.sourceKey });
         collections.set(key(), [...(collections.get(key()) ?? []), imported]);
         return imported;
      });
   }
});

afterEach(() => {
   for (const cache of caches.splice(0)) cache.clear();
   vi.useRealTimers();
   focusManager.setFocused(undefined);
   onlineManager.setOnline(true);
   vi.unstubAllGlobals();
});

async function advanceTime(milliseconds = 1) {
   await act(() => vi.advanceTimersByTimeAsync(milliseconds));
}

describe.each(["gifs", "stickers"] as const)("%s collection refresh", (kind) => {
   beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-21T12:00:00Z"));
   });

   it("refreshes at the earliest signed link's thirty-second margin and exposes renewed metadata", async () => {
      const first = expression({ type: ExpressionType.UPLOADED, ex: Date.now() / 1000 + 120, hm: "old", src: "/old.gif" });
      const later = expression({ id: "later", type: ExpressionType.UPLOADED, ex: Date.now() / 1000 + 300 });
      const { result } = setup(kind, [later, first], true);
      await advanceTime();
      expect(result.current.items).toEqual([later, first]);
      const renewed = { ...first, ex: first.ex! + 600, hm: "renewed", src: "/renewed.gif" };
      collections.set(`user-1:${kind}`, [later, renewed]);

      await advanceTime(89_998);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
      expect(result.current.items).toEqual([later, first]);
      await advanceTime(2);

      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
      expect(result.current.items).toEqual([later, renewed]);
   });

   it.each(["closed", "no expiry"])("avoids periodic requests when %s but still refreshes on reopening", async (condition) => {
      const saved = expression(condition === "closed" ? { type: ExpressionType.UPLOADED, ex: Date.now() / 1000 + 120 } : {});
      const { result, rerender } = setup(kind, [saved], true);
      await advanceTime();
      if (condition === "closed") rerender({ isOpen: false });
      const updated = { ...saved, title: "Changed while away", ex: undefined };
      collections.set(`user-1:${kind}`, [updated]);

      await advanceTime(180_000);

      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
      expect(result.current.items).toEqual([saved]);
      rerender({ isOpen: false });
      rerender({ isOpen: true });
      await advanceTime();
      expect(result.current.items).toEqual([updated]);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
   });

   it.each(["focus", "reconnect"] as const)("refreshes stale data on %s only while open, preserving freshness rules", async (trigger) => {
      const saved = expression();
      const { result, rerender } = setup(kind, [saved], true);
      await advanceTime();
      const notify = async () => {
         act(() => {
            if (trigger === "focus") {
               focusManager.setFocused(false);
               focusManager.setFocused(true);
            } else {
               onlineManager.setOnline(false);
               onlineManager.setOnline(true);
            }
         });
         await advanceTime();
      };
      const updated = { ...saved, title: "Refreshed" };
      collections.set(`user-1:${kind}`, [updated]);

      await notify();
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
      expect(result.current.items).toEqual([saved]);
      await advanceTime(60_000);
      await notify();
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
      expect(result.current.items).toEqual([updated]);

      rerender({ isOpen: false });
      collections.set(`user-1:${kind}`, []);
      await advanceTime(60_000);
      await notify();
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
      expect(result.current.items).toEqual([updated]);
   });

   it("refreshes on opening and reopening even while the previous response is fresh", async () => {
      const saved = expression();
      const { result, rerender } = setup(kind, [saved]);
      await advanceTime();
      const opened = { ...saved, title: "Opened" };
      collections.set(`user-1:${kind}`, [opened]);

      rerender({ isOpen: true });
      await advanceTime();
      expect(result.current.items).toEqual([opened]);
      const reopened = { ...saved, title: "Reopened" };
      collections.set(`user-1:${kind}`, [reopened]);
      rerender({ isOpen: false });
      rerender({ isOpen: true });
      await advanceTime();

      expect(result.current.items).toEqual([reopened]);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(3);
   });

   it.each(["client", "user"] as const)("gates fetching and scheduled refresh while the %s is unavailable", async (dependency) => {
      const setAvailable = (available: boolean) => {
         if (dependency === "client") mocks.clientAvailable = available;
         else mocks.user = available ? { id: "user-1" } : undefined;
      };
      setAvailable(false);
      const { result, rerender } = setup(kind, [], true);

      await advanceTime(180_000);
      expect(mocks[kind].getAll).not.toHaveBeenCalled();
      expect(result.current.items).toEqual([]);
      const saved = expression({ type: ExpressionType.UPLOADED, ex: Date.now() / 1000 + 120 });
      collections.set(`user-1:${kind}`, [saved]);
      setAvailable(true);
      rerender({ isOpen: true });
      await advanceTime();
      expect(result.current.items).toEqual([saved]);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);

      setAvailable(false);
      rerender({ isOpen: true });
      await advanceTime(180_000);
      act(() => {
         focusManager.setFocused(false);
         focusManager.setFocused(true);
         onlineManager.setOnline(false);
         onlineManager.setOnline(true);
      });
      await advanceTime();
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);

      const renewed = { ...saved, ex: Date.now() / 1000 + 600, hm: "renewed" };
      collections.set(`user-1:${kind}`, [renewed]);
      setAvailable(true);
      rerender({ isOpen: true });
      await advanceTime();
      expect(result.current.items).toEqual([renewed]);
   });

   it("stops refreshing the previous user's collection on user changes and stops all refresh on unmount", async () => {
      const saved = expression({ type: ExpressionType.UPLOADED, ex: Date.now() / 1000 + 120 });
      const otherUser = expression({ id: "other-user" });
      const { result, rerender, unmount } = setup(kind, [saved], true);
      collections.set(`user-2:${kind}`, [otherUser]);
      await advanceTime();

      mocks.user = { id: "user-2" };
      rerender({ isOpen: true });
      await advanceTime();
      expect(result.current.items).toEqual([otherUser]);
      await advanceTime(180_000);
      expect(result.current.items).toEqual([otherUser]);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);

      const renewed = { ...saved, ex: Date.now() / 1000 + 120, hm: "renewed" };
      collections.set(`user-1:${kind}`, [renewed]);
      mocks.user = { id: "user-1" };
      rerender({ isOpen: true });
      await advanceTime();
      expect(result.current.items).toEqual([renewed]);
      const requests = mocks[kind].getAll.mock.calls.length;
      unmount();
      await advanceTime(180_000);
      act(() => {
         focusManager.setFocused(false);
         focusManager.setFocused(true);
         onlineManager.setOnline(false);
         onlineManager.setOnline(true);
      });
      await advanceTime();
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(requests);
   });
});

describe.each(["gifs", "stickers"] as const)("%s collection", (kind) => {
   it("replaces gateway updates and orders by usage count then last used time without refetching", async () => {
      const first = expression({ id: "first", usageCount: 3, lastUsedAt: "2026-11-14T12:00:00.000Z" });
      const second = expression({ id: "second", usageCount: 2, lastUsedAt: "2026-11-13T12:00:00.000Z" });
      const third = expression({ id: "third", usageCount: 4 });
      const { result } = setup(kind, [third, first, second]);
      await waitFor(() => expect(result.current.items).toEqual([third, first, second]));
      const updated = { ...second, title: "Updated", usageCount: 3, lastUsedAt: "2026-11-15T12:00:00.000Z" };

      act(() => mocks.gateway.emit("expression_update", { kind, expression: updated }));

      await waitFor(() => expect(result.current.items).toEqual([third, updated, first]));
      expect(result.current.find(second)).toEqual(updated);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
   });

   it("inserts newly used expressions, keeps source types distinct, and handles replay without duplicates", async () => {
      const provider = expression({ id: "same", usageCount: 2 });
      const unused = expression({ id: "unused", type: ExpressionType.UPLOADED, usageCount: undefined, lastUsedAt: undefined });
      const uploaded = expression({ id: "same", type: ExpressionType.UPLOADED, usageCount: 1, lastUsedAt: "2026-11-15T12:00:00.000Z" });
      const { result } = setup(kind, [provider, unused]);
      await waitFor(() => expect(result.current.items).toEqual([provider, unused]));

      act(() => mocks.gateway.emit("expression_update", { kind, expression: uploaded }));
      await waitFor(() => expect(result.current.items).toEqual([provider, uploaded, unused]));
      const updated = { ...uploaded, usageCount: 3 };
      act(() => {
         mocks.gateway.emit("expression_update", { kind, expression: updated });
         mocks.gateway.emit("expression_update", { kind, expression: updated });
      });

      await waitFor(() => expect(result.current.items).toEqual([updated, provider, unused]));
      expect(result.current.find(provider)).toEqual(provider);
      expect(result.current.find(uploaded)).toEqual(updated);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
   });

   it("leaves an unloaded collection alone so its first use fetches the complete list", async () => {
      const otherKind = kind === "gifs" ? "stickers" : "gifs";
      const other = expression({ title: "Other collection" });
      const newlyUsed = expression({ id: "new", usageCount: 1 });
      const older = expression({ id: "older" });
      const { result, rerender } = setup(otherKind, [other]);
      collections.set(`user-1:${kind}`, [newlyUsed, older]);
      await waitFor(() => expect(result.current.items).toEqual([other]));

      act(() => mocks.gateway.emit("expression_update", { kind, expression: newlyUsed }));

      expect(mocks[kind].getAll).not.toHaveBeenCalled();
      expect(result.current.items).toEqual([other]);
      rerender({ kind });
      await waitFor(() => expect(result.current.items).toEqual([newlyUsed, older]));
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
      expect(mocks[otherKind].getAll).toHaveBeenCalledTimes(1);
   });

   it.each(["reference", "import", "upload"] as const)(
      "reconciles usage after a successful %s and still removes the saved expression",
      async (action) => {
         const mostUsed = expression({ id: "most-used", usageCount: 5 });
         const older = expression({ id: "older", usageCount: 1 });
         const saved =
            action === "reference"
               ? expression()
               : expression({ id: "imported", type: ExpressionType.UPLOADED, sourceKey: action === "import" ? "attachment:123" : undefined });
         const media = action === "import" ? { attachmentId: "123", src: "https://external.example/new.webp" } : saved;
         mocks.fetch.mockResolvedValue(new Response(new Uint8Array([1, 2, 3])));
         const { result } = setup(kind, [mostUsed, older]);
         await waitFor(() => expect(result.current.items).toEqual([mostUsed, older]));

         await act(() =>
            action === "upload" ? result.current.upload({ data: new Uint8Array([1]).buffer, name: "new.gif" }) : result.current.toggle(media),
         );

         await waitFor(() => expect(result.current.find(media)).toEqual(saved));
         expect(result.current.items).toEqual([mostUsed, older, saved]);
         expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
         const updated = { ...saved, usageCount: 3, lastUsedAt: "2026-11-15T12:00:00.000Z" };
         act(() => {
            mocks.gateway.emit("expression_update", { kind, expression: updated });
            mocks.gateway.emit("expression_update", { kind, expression: updated });
         });

         await waitFor(() => expect(result.current.items).toEqual([mostUsed, updated, older]));
         expect(result.current.find(media)).toEqual(updated);
         expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);

         await act(() => result.current.toggle(media));

         await waitFor(() => expect(result.current.items).toEqual([mostUsed, older]));
         expect(result.current.find(media)).toBeUndefined();
         expect(mocks[kind].remove).toHaveBeenCalledExactlyOnceWith(updated);
         expect(mocks[kind].getAll).toHaveBeenCalledTimes(3);
      },
   );

   it("reconciles later usage after a successful removal without replay duplicates", async () => {
      const saved = expression();
      const { result } = setup(kind, [saved]);
      await waitFor(() => expect(result.current.find(saved)).toEqual(saved));

      await act(() => result.current.toggle(saved));

      await waitFor(() => expect(result.current.items).toEqual([]));
      expect(result.current.find(saved)).toBeUndefined();
      const usedAgain = { ...saved, usageCount: 1, lastUsedAt: "2026-11-15T12:00:00.000Z" };
      act(() => {
         mocks.gateway.emit("expression_update", { kind, expression: usedAgain });
         mocks.gateway.emit("expression_update", { kind, expression: usedAgain });
      });

      await waitFor(() => expect(result.current.items).toEqual([usedAgain]));
      expect(result.current.find(saved)).toEqual(usedAgain);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(2);
   });

   it("adds a provider reference and exposes the refreshed saved expression without downloading", async () => {
      const media = expression();
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.find(media)).toBeUndefined();

      await act(() => result.current.toggle(media));

      await waitFor(() => expect(result.current.items).toEqual([media]));
      expect(result.current.find(media)).toEqual(media);
      expect(mocks[kind].add).toHaveBeenCalledWith({ id: "cat", type: ExpressionType.KLIPY, ex: undefined, hm: undefined });
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks[kind].upload).not.toHaveBeenCalled();
   });

   it("removes a saved expression using its collection reference", async () => {
      const saved = expression({ id: "imported", type: ExpressionType.UPLOADED, sourceKey: "attachment:123" });
      const media = { attachmentId: "123", src: "https://media.example/cat.gif" };
      const { result } = setup(kind, [saved]);
      await waitFor(() => expect(result.current.find(media)).toEqual(saved));

      await act(() => result.current.toggle(media));

      await waitFor(() => expect(result.current.items).toEqual([]));
      expect(result.current.find(media)).toBeUndefined();
      expect(mocks[kind].remove).toHaveBeenCalledExactlyOnceWith(saved);
      expect(mocks[kind].add).not.toHaveBeenCalled();
      expect(mocks.fetch).not.toHaveBeenCalled();
      expect(mocks[kind].upload).not.toHaveBeenCalled();
   });

   it.each([{ id: "uploaded", type: ExpressionType.UPLOADED, ex: 2_000_000_000, hm: "signature" }, { url: "https://klipy.com/gifs/cat" }])(
      "adds reusable media by reference: %j",
      async (media) => {
         const { result } = setup(kind);
         await waitFor(() => expect(result.current.isSuccess).toBe(true));

         await act(() => result.current.toggle(media));

         const expected =
            "id" in media
               ? { id: "uploaded", type: ExpressionType.UPLOADED, ex: 2_000_000_000, hm: "signature" }
               : { id: "cat", type: ExpressionType.KLIPY };
         await waitFor(() => expect(result.current.find(media)).toMatchObject(expected));
         expect(mocks[kind].add).toHaveBeenCalledExactlyOnceWith(expected);
         expect(mocks.fetch).not.toHaveBeenCalled();
         expect(mocks[kind].upload).not.toHaveBeenCalled();
      },
   );

   it("imports external media once and recognizes its original attachment on the next encounter", async () => {
      const media = { attachmentId: "123", title: "Cat", src: "https://media.example/cat.webp", url: "https://example.com/post" };
      mocks.fetch.mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { "Content-Type": "image/webp" } }));
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(() => result.current.toggle(media));

      await waitFor(() => expect(result.current.find(media)).toMatchObject({ id: "imported", sourceKey: "attachment:123" }));
      expect(result.current.items).toHaveLength(1);
      expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith("https://cdn.example/cdn/external/https%3A%2F%2Fmedia.example%2Fcat.webp");
      const [file, metadata] = mocks[kind].upload.mock.calls[0];
      expect(new Uint8Array(file.data)).toEqual(new Uint8Array([1, 2, 3]));
      expect(file).toMatchObject({ name: "Cat", contentType: "image/webp" });
      expect(metadata).toEqual({ sourceKey: "attachment:123" });
      expect(mocks[kind].add).not.toHaveBeenCalled();

      await act(() => result.current.toggle({ ...media, src: "https://media.example/refreshed.webp" }));

      await waitFor(() => expect(result.current.items).toEqual([]));
      expect(mocks[kind].remove).toHaveBeenCalledWith(expect.objectContaining({ id: "imported", type: ExpressionType.UPLOADED }));
      expect(mocks.fetch).toHaveBeenCalledTimes(1);
      expect(mocks[kind].upload).toHaveBeenCalledTimes(1);
   });

   it.each([
      ["https://cdn.example/cdn/files/cat.webp?ex=123&hm=sig", "https://cdn.example/cdn/files/cat.webp?ex=123&hm=sig"],
      ["files/cat.webp", "https://cdn.example/cdn/files/cat.webp"],
      ["https://cdn.example/other/cat.webp", "https://cdn.example/cdn/external/https%3A%2F%2Fcdn.example%2Fother%2Fcat.webp"],
      ["https://external.example/cat.webp", "https://cdn.example/cdn/external/https%3A%2F%2Fexternal.example%2Fcat.webp"],
   ])("imports %s through the existing download route", async (src, requestUrl) => {
      mocks.fetch.mockResolvedValue(new Response(new Uint8Array([4, 5]), { headers: { "Content-Type": "image/webp" } }));
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(() => result.current.toggle({ src }));

      await waitFor(() => expect(result.current.items).toHaveLength(1));
      expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(requestUrl);
      expect(mocks[kind].upload).toHaveBeenCalledWith(expect.objectContaining({ name: "cat.webp", contentType: "image/webp" }), {
         sourceKey: undefined,
      });
   });

   it("uses the URL fallback and retains its exact source key and content type fallback", async () => {
      const media = { url: "https://external.example/cat.webp?b=2&a=1#original", contentType: "image/webp" };
      mocks.fetch.mockResolvedValue(new Response(new Uint8Array([4, 5])));
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(() => result.current.toggle(media));

      await waitFor(() =>
         expect(result.current.find(media)).toMatchObject({ id: "imported", sourceKey: "url:https://external.example/cat.webp?b=2&a=1#original" }),
      );
      expect(mocks[kind].upload).toHaveBeenCalledWith(expect.objectContaining({ name: "cat.webp", contentType: "image/webp" }), {
         sourceKey: "url:https://external.example/cat.webp?b=2&a=1#original",
      });
      expect(result.current.find({ url: "https://external.example/cat.webp?a=1&b=2#original" })).toBeUndefined();
   });

   it.each(["missing address", "unsuccessful download", "empty data", "oversized data", "network failure"])(
      "reports %s once without uploading",
      async (failure) => {
         const maxBytes = kind === "gifs" ? CONSTANTS.GIF_MAX_BYTES : CONSTANTS.STICKER_MAX_BYTES;
         const media = failure === "missing address" ? {} : { src: "https://media.example/cat.gif" };
         const message = {
            "missing address": "This media has no download URL.",
            "unsuccessful download": "Failed to download media: 503",
            "empty data": "The downloaded media is empty.",
            "oversized data": `Choose a file smaller than ${kind === "gifs" ? 25 : 10} MB.`,
            "network failure": "Network unavailable",
         }[failure]!;
         if (failure === "network failure") mocks.fetch.mockRejectedValue(new Error(message));
         else
            mocks.fetch.mockResolvedValue(
               new Response(new ArrayBuffer(failure === "oversized data" ? maxBytes + 1 : 0), {
                  status: failure === "unsuccessful download" ? 503 : 200,
               }),
            );
         const { result } = setup(kind);
         await waitFor(() => expect(result.current.isSuccess).toBe(true));

         await act(async () => {
            await expect(result.current.toggle(media)).rejects.toThrow(message);
         });

         await waitFor(() => expect(result.current.isPending).toBe(false));
         expect(mocks.showError).toHaveBeenCalledExactlyOnceWith(message);
         expect(mocks[kind].upload).not.toHaveBeenCalled();
         expect(mocks[kind].add).not.toHaveBeenCalled();
         expect(result.current.items).toEqual([]);
         expect(result.current.find(media)).toBeUndefined();
         if (failure === "missing address") expect(mocks.fetch).not.toHaveBeenCalled();
      },
   );

   it.each(["add", "remove", "import", "upload"] as const)("allows retry after a failed %s with one error notification", async (action) => {
      const media =
         action === "import"
            ? { url: "https://media.example/cat.gif" }
            : expression(action === "upload" ? { id: "imported", type: ExpressionType.UPLOADED } : {});
      const operation = action === "import" ? "upload" : action;
      const file = { data: new Uint8Array([1, 2, 3]).buffer, name: "selected.gif", contentType: "image/gif" };
      mocks[kind][operation].mockRejectedValueOnce(new Error("Write failed"));
      mocks.fetch.mockImplementation(async () => new Response(new Uint8Array([1, 2, 3])));
      const { result } = setup(kind, action === "remove" ? [expression()] : []);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const save = () => (action === "upload" ? result.current.upload(file) : result.current.toggle(media));

      await act(async () => {
         await expect(save()).rejects.toThrow("Write failed");
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(mocks.showError).toHaveBeenCalledExactlyOnceWith("Write failed");
      expect(result.current.items).toHaveLength(action === "remove" ? 1 : 0);

      await act(() => save());

      await waitFor(() => expect(result.current.items).toHaveLength(action === "remove" ? 0 : 1));
      expect(!!result.current.find(media)).toBe(action !== "remove");
      expect(mocks[kind][operation]).toHaveBeenCalledTimes(2);
      expect(mocks.showError).toHaveBeenCalledTimes(1);
   });

   it("stays pending from download through upload and collection refresh", async () => {
      const download = Promise.withResolvers<Response>();
      const upload = Promise.withResolvers<void>();
      const refresh = Promise.withResolvers<void>();
      mocks.fetch.mockReturnValue(download.promise);
      const performUpload = mocks[kind].upload.getMockImplementation()!;
      mocks[kind].upload.mockImplementationOnce(async (...args) => {
         await upload.promise;
         return performUpload(...args);
      });
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const getAll = mocks[kind].getAll.getMockImplementation()!;
      mocks[kind].getAll.mockImplementationOnce(async () => {
         await refresh.promise;
         return getAll();
      });
      let pending: Promise<unknown>;

      act(() => {
         pending = result.current.toggle({ url: "https://media.example/cat.gif" });
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));
      expect(mocks[kind].upload).not.toHaveBeenCalled();
      await act(async () => download.resolve(new Response(new Uint8Array([1, 2, 3]))));
      await waitFor(() => expect(mocks[kind].upload).toHaveBeenCalledOnce());
      expect(result.current.isPending).toBe(true);
      await act(async () => upload.resolve());
      expect(result.current.isPending).toBe(true);
      await act(async () => {
         refresh.resolve();
         await pending;
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.find({ url: "https://media.example/cat.gif" })).toMatchObject({ id: "imported" });
   });

   it.each(["add", "remove"] as const)("reports pending while a reference %s is in flight", async (operation) => {
      const write = Promise.withResolvers<void>();
      const performWrite = mocks[kind][operation].getMockImplementation()!;
      mocks[kind][operation].mockImplementationOnce(async (...args) => {
         await write.promise;
         return performWrite(...args);
      });
      const { result } = setup(kind, operation === "remove" ? [expression()] : []);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      let pending: Promise<unknown>;

      act(() => {
         pending = result.current.toggle(expression());
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));
      await act(async () => {
         write.resolve();
         await pending;
      });
      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(!!result.current.find(expression())).toBe(operation === "add");
   });

   it("keeps equal identifiers from different source types distinct", async () => {
      const provider = expression({ id: "same" });
      const uploaded = expression({ id: "same", type: ExpressionType.UPLOADED });
      const { result } = setup(kind, [uploaded]);
      await waitFor(() => expect(result.current.items).toEqual([uploaded]));
      expect(result.current.find(provider)).toBeUndefined();

      await act(() => result.current.toggle(provider));

      await waitFor(() => expect(result.current.items).toEqual([uploaded, provider]));
      expect(result.current.find(provider)).toEqual(provider);
      expect(result.current.find(uploaded)).toEqual(uploaded);
      await act(() => result.current.toggle(provider));
      await waitFor(() => expect(result.current.items).toEqual([uploaded]));
   });

   it.each([undefined, "existing:source"])("recognizes a source-key match before adding another reference (%s)", async (sourceKey) => {
      const media = expression({ sourceKey });
      const saved = expression({ id: "imported", type: ExpressionType.UPLOADED, sourceKey: sourceKey ?? "url:https://klipy.com/gifs/cat" });
      const { result } = setup(kind, [saved]);
      await waitFor(() => expect(result.current.find(media)).toEqual(saved));

      await act(() => result.current.toggle(media));

      await waitFor(() => expect(result.current.items).toEqual([]));
      expect(mocks[kind].remove).toHaveBeenCalledExactlyOnceWith(saved);
      expect(mocks[kind].add).not.toHaveBeenCalled();
   });

   it("keeps direct file uploads pending through the upload and refresh, then exposes the created expression", async () => {
      const file = { data: new Uint8Array([1, 2, 3]).buffer, name: "selected.gif", contentType: "image/gif" };
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const upload = Promise.withResolvers<APIExpression>();
      const refresh = Promise.withResolvers<APIExpression[]>();
      const created = expression({ id: "created", type: ExpressionType.UPLOADED });
      mocks[kind].upload.mockReturnValueOnce(upload.promise);
      mocks[kind].getAll.mockReturnValueOnce(refresh.promise);
      let pending: Promise<unknown>;

      act(() => {
         pending = result.current.upload(file);
      });

      await waitFor(() => expect(result.current.isPending).toBe(true));
      expect(mocks[kind].upload).toHaveBeenCalledExactlyOnceWith(file);
      expect(mocks[kind].getAll).toHaveBeenCalledTimes(1);
      expect(result.current.items).toEqual([]);
      await act(async () => upload.resolve(created));
      await waitFor(() => expect(mocks[kind].getAll).toHaveBeenCalledTimes(2));
      expect(result.current.isPending).toBe(true);
      expect(result.current.items).toEqual([]);
      await act(async () => {
         refresh.resolve([created]);
         await pending;
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(result.current.items).toEqual([created]);
      expect(mocks.fetch).not.toHaveBeenCalled();
   });
});

it("isolates gateway updates between loaded GIFs, stickers, and users", async () => {
   const gif = expression({ title: "GIF" });
   const sticker = expression({ title: "Sticker" });
   const otherUserGif = expression({ title: "Other user's GIF" });
   const { result, rerender } = setup("gifs", [gif]);
   collections.set("user-1:stickers", [sticker]);
   collections.set("user-2:gifs", [otherUserGif]);
   await waitFor(() => expect(result.current.items).toEqual([gif]));
   rerender({ kind: "stickers" });
   await waitFor(() => expect(result.current.items).toEqual([sticker]));
   const updatedGif = { ...gif, usageCount: 2 };

   act(() => mocks.gateway.emit("expression_update", { kind: "gifs", expression: updatedGif }));

   expect(result.current.items).toEqual([sticker]);
   rerender({ kind: "gifs" });
   await waitFor(() => expect(result.current.items).toEqual([updatedGif]));
   mocks.user = { id: "user-2" };
   rerender({ kind: "gifs" });
   await waitFor(() => expect(result.current.items).toEqual([otherUserGif]));
   const updatedOtherUserGif = { ...otherUserGif, usageCount: 1 };

   act(() => mocks.gateway.emit("expression_update", { kind: "gifs", expression: updatedOtherUserGif }));

   await waitFor(() => expect(result.current.items).toEqual([updatedOtherUserGif]));
   mocks.user = { id: "user-1" };
   rerender({ kind: "gifs" });
   await waitFor(() => expect(result.current.items).toEqual([updatedGif]));
   rerender({ kind: "stickers" });
   await waitFor(() => expect(result.current.items).toEqual([sticker]));
   expect(mocks.gifs.getAll).toHaveBeenCalledTimes(2);
   expect(mocks.stickers.getAll).toHaveBeenCalledTimes(1);
});

it("isolates GIFs, stickers, and different users through the same collection interface", async () => {
   const gif = expression();
   const sticker = expression({ title: "Sticker" });
   const { result, rerender } = setup("gifs", [gif]);
   collections.set("user-1:stickers", [sticker]);
   await waitFor(() => expect(result.current.items).toEqual([gif]));

   rerender({ kind: "stickers" });
   await waitFor(() => expect(result.current.items).toEqual([sticker]));
   mocks.user = { id: "user-2" };
   rerender({ kind: "gifs" });
   await waitFor(() => expect(result.current.isSuccess).toBe(true));
   expect(result.current.items).toEqual([]);
   expect(result.current.find(gif)).toBeUndefined();
   await act(() => result.current.toggle(gif));
   await waitFor(() => expect(result.current.find(gif)).toEqual(gif));
   mocks.user = { id: "user-1" };
   rerender({ kind: "gifs" });
   await waitFor(() => expect(result.current.items).toEqual([gif]));
   await act(() => result.current.toggle(gif));
   await waitFor(() => expect(result.current.items).toEqual([]));
   rerender({ kind: "stickers" });
   await waitFor(() => expect(result.current.items).toEqual([sticker]));
   mocks.user = { id: "user-2" };
   rerender({ kind: "gifs" });
   await waitFor(() => expect(result.current.items).toEqual([gif]));
});
