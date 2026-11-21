import type { APIExpression, APIExpressionReference, ExpressionKind, RawFile } from "@huginnjs/shared";
import type { PropsWithChildren } from "react";

import { CONSTANTS, ExpressionType, resolveCdnUrl } from "@huginnjs/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExpressions } from "./useExpressions";

const mocks = vi.hoisted(() => ({
   gifs: { getAll: vi.fn(), add: vi.fn(), remove: vi.fn(), upload: vi.fn() },
   stickers: { getAll: vi.fn(), add: vi.fn(), remove: vi.fn(), upload: vi.fn() },
   user: { id: "user-1" },
   showError: vi.fn(),
   fetch: vi.fn<typeof fetch>(),
}));

vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => ({ ...mocks, cdn: { asset: (path: string) => resolveCdnUrl(path, "https://cdn.example/cdn") } }),
}));
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

function setup(kind: ExpressionKind, items: APIExpression[] = []) {
   collections.set(`${mocks.user.id}:${kind}`, items);
   const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } });
   caches.push(cache);
   const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
   return renderHook(({ kind }) => useExpressions(kind), { wrapper, initialProps: { kind } });
}

beforeEach(() => {
   vi.resetAllMocks();
   mocks.user = { id: "user-1" };
   collections.clear();
   vi.stubGlobal("fetch", mocks.fetch);
   for (const kind of ["gifs", "stickers"] as const) {
      const key = () => `${mocks.user.id}:${kind}`;
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
   vi.unstubAllGlobals();
});

describe.each(["gifs", "stickers"] as const)("%s collection", (kind) => {
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

   it.each(["add", "remove", "import"] as const)("allows retry after a failed %s with one error notification", async (action) => {
      const media = action === "import" ? { url: "https://media.example/cat.gif" } : expression();
      const operation = action === "import" ? "upload" : action;
      mocks[kind][operation].mockRejectedValueOnce(new Error("Write failed"));
      mocks.fetch.mockImplementation(async () => new Response(new Uint8Array([1, 2, 3])));
      const { result } = setup(kind, action === "remove" ? [expression()] : []);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(async () => {
         await expect(result.current.toggle(media)).rejects.toThrow("Write failed");
      });

      await waitFor(() => expect(result.current.isPending).toBe(false));
      expect(mocks.showError).toHaveBeenCalledExactlyOnceWith("Write failed");
      expect(result.current.items).toHaveLength(action === "remove" ? 1 : 0);

      await act(() => result.current.toggle(media));

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

   it("preserves direct file uploads for the picker", async () => {
      const file = { data: new Uint8Array([1, 2, 3]).buffer, name: "selected.gif", contentType: "image/gif" };
      const { result } = setup(kind);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await act(() => result.current.upload(file));

      await waitFor(() => expect(result.current.items).toHaveLength(1));
      expect(mocks[kind].upload).toHaveBeenCalledExactlyOnceWith(file);
      expect(mocks.fetch).not.toHaveBeenCalled();
   });
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
