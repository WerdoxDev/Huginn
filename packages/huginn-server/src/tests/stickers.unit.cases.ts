import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";
import Elysia from "elysia";

process.env.ACCESS_TOKEN_SECRET = "stickers-unit-test-access-secret";
process.env.CDN_TOKEN_SECRET = "stickers-unit-test-cdn-secret";

type Row = { id: bigint; userId: bigint; title: string; asset: string; width: number; height: number };
const rows = new Map<bigint, Row>();
const files = new Map<string, Blob>();
const findMany = mock(async (_args: unknown) => [...rows.values()]);
const deleteMany = mock(async ({ where }: { where: { id: bigint; userId: bigint } }) => {
   const row = rows.get(where.id);
   return { count: row?.userId === where.userId && rows.delete(where.id) ? 1 : 0 };
});
const createMessage = mock(async (data: Record<string, unknown>) => ({ ...data, id: "456", embeds: data.embeds ?? [] }));
const database = {
   channel: { getById: async () => ({ id: "10" }) },
   user: { hasChannel: async () => true },
   message: { createOne: createMessage },
   authSession: { findFirst: async () => ({ id: 1n, lastSeenAt: new Date() }) },
   sticker: {
      findMany,
      findUnique: async ({ where }: { where: { id: bigint } }) => rows.get(where.id) ?? null,
      create: async ({ data }: { data: Row }) => {
         rows.set(data.id, data);
         return data;
      },
      deleteMany,
   },
};
mock.module("@huginn/backend-shared/database", () => ({ prisma: database, selectPrivateUser: {} }));
mock.module("../setup", () => ({ env: { KLIPY_KEY: "test-key" } }));
mock.module("../../../huginn-cdn/src/server", () => ({
   storage: {
      writeFile: async (_category: string, _dir: string, filename: string, file: Blob) => {
         files.set(filename, file);
         return true;
      },
      getFile: async (_category: string, _dir: string, filename: string) => files.get(filename),
   },
}));

const { createToken } = await import("@huginn/backend-shared/token-factory");
// Load the sibling service only at runtime; its own tsconfig checks its sources.
const cdnGetModule = "../../../huginn-cdn/src/routes/stickers/[filename].get";
const cdnPostModule = "../../../huginn-cdn/src/routes/stickers/[id].post";
const { getSticker } = await import(cdnGetModule);
const { postSticker: cdnPostSticker } = await import(cdnPostModule);
const cdn = new Elysia({ normalize: "typebox" }).use(getSticker).use(cdnPostSticker);
const { request: upstreamRequest } = await import("../utils/server-request");

mock.module("../utils/server-request", () => ({
   cdnUpload: async (path: string, options: { files: Array<{ data: ArrayBuffer; name: string }> }) => {
      const form = new FormData();
      form.append("files[0]", new Blob([options.files[0].data]), options.files[0].name);
      const response = await cdn.handle(
         new Request(`http://localhost/cdn${path}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${await createToken("cdn", undefined)}` },
            body: form,
         }),
      );
      if (!response.ok) {
         const { HuginnAPIError } = await import("@huginnjs/shared");
         const error = await response.json();
         throw new HuginnAPIError(error, error.code, response.status, "POST", path, {});
      }
      return response.json();
   },
}));

const { getTrendingStickers } = await import("../routes/stickers/trending.get");
const { getSearchStickers } = await import("../routes/stickers/search.get");
const { getStickerCategories } = await import("../routes/stickers/categories.get");
const { getUserStickers } = await import("../routes/users/@me/stickers.get");
const { postSticker } = await import("../routes/stickers/stickers.post");
const { deleteUserSticker } = await import("../routes/users/@me/stickers/[id].delete");
const { resolveSticker } = await import("../utils/stickers");
const { fetchStickers, fetchSearchGifs, fetchTrendingGifs, fetchGifItems, fetchGifCategories, fetchStickerCategories, filterGifs, filterStickers } =
   await import("../utils/klipy");
mock.module("../utils/gateway-utils", () => ({ dispatchToTopic: () => {} }));
mock.module("../utils/helpers", () => ({ filterMessage: async (message: unknown) => message, sendAddMessagePushNotification: async () => {} }));
mock.module("../utils/route-utils", () => ({
   getMessageTokens: () => [],
   generateEmbedsFromContent: async () => [],
   processAttachments: async () => [],
   processEmbeds: async () => [],
   processMentions: async () => ({ userMentions: [], everyoneMentions: [], ownerMentions: [] }),
}));
mock.module("../utils/validation", () => ({ validateEmbeds: () => true }));
const { postChannelMessage } = await import("../routes/channels/[channelId]/messages.post");
const api = new Elysia({ normalize: "typebox" })
   .use(getTrendingStickers)
   .use(getSearchStickers)
   .use(getStickerCategories)
   .use(getUserStickers)
   .use(postSticker)
   .use(deleteUserSticker)
   .use(postChannelMessage);
const token = await createToken("user-access", { id: "1", sessionId: "1", authType: "password", lastAuthenticatedAt: Date.now() });
const headers = { Authorization: `Bearer ${token}` };
const originalFetch = globalThis.fetch;
const providerItem = { slug: "happy-cat", title: "Happy cat", file: { sm: { webp: { url: "https://static.klipy.com/cat.webp", width: 100, height: 80 } } } };
const providerFetch = mock(async (_input: string | URL | Request) => Response.json({ result: true, data: { data: [providerItem] } }));

beforeEach(() => {
   rows.clear();
   files.clear();
   findMany.mockClear();
   createMessage.mockClear();
   deleteMany.mockClear();
   providerFetch.mockClear();
   globalThis.fetch = providerFetch as unknown as typeof fetch;
});
afterAll(() => {
   globalThis.fetch = originalFetch;
});

describe("shared Klipy helpers", () => {
   test("preserves GIF responses and encodes search terms", async () => {
      const gif = {
         ...providerItem,
         id: 42,
         blur_preview: "preview",
         file: { sm: { webm: { url: "https://static.klipy.com/cat.webm", width: 100, height: 80 } } },
      };
      const payload = { result: true, data: { data: [gif], current_page: 2, per_page: 24, has_next: true } };
      const fetchGif = mock(async (_input: string | URL | Request) => Response.json(payload));
      globalThis.fetch = fetchGif as unknown as typeof fetch;

      const gifs = await fetchSearchGifs("1", "cats & dogs #happy?", 24, 2);
      expect(gifs).toEqual(payload);
      const url = new URL(String(fetchGif.mock.calls[0][0]));
      expect(url.pathname).toEndWith("/gifs/search");
      expect(url.searchParams.get("q")).toBe("cats & dogs #happy?");
      expect(url.searchParams.get("per_page")).toBe("24");
      expect(url.searchParams.get("page")).toBe("2");
      expect(filterGifs(gifs.data, { quality: "sm", format: "webm" })).toEqual([
         {
            id: 42,
            title: "Happy cat",
            url: "https://klipy.com/gifs/happy-cat",
            src: "https://static.klipy.com/cat.webm",
            width: 100,
            height: 80,
            preview: "preview",
         },
      ]);
   });

   test("keeps GIF pagination optional and encodes item slugs", async () => {
      await fetchTrendingGifs("1");
      const trendingUrl = new URL(String(providerFetch.mock.calls[0][0]));
      expect(trendingUrl.pathname).toEndWith("/gifs/trending");
      expect(trendingUrl.searchParams.has("per_page")).toBe(false);
      expect(trendingUrl.searchParams.has("page")).toBe(false);

      await fetchGifItems(["cat&dog", "happy-cat"]);
      const itemsUrl = new URL(String(providerFetch.mock.calls[1][0]));
      expect(itemsUrl.pathname).toEndWith("/gifs/items");
      expect(itemsUrl.searchParams.get("slugs")).toBe("cat&dog,happy-cat");
   });

   test("keeps the public category shapes for GIFs and stickers", async () => {
      const payload = {
         result: true,
         data: { locale: "en_US", categories: [{ category: "happy", query: "happy", preview_url: "https://static.klipy.com/happy.gif" }] },
      };
      globalThis.fetch = mock(async () => Response.json(payload)) as unknown as typeof fetch;
      expect(await fetchGifCategories()).toEqual(payload);
      expect(await fetchStickerCategories()).toEqual([{ name: "happy", src: "https://static.klipy.com/happy.gif" }]);
   });

   test("supports sticker format fallbacks and omits unavailable GIF formats", () => {
      const item = {
         ...providerItem,
         id: 42,
         blur_preview: "preview",
         file: { md: { gif: { url: "https://static.klipy.com/cat.gif", width: 100, height: 80 } } },
      };
      expect(filterStickers([item])[0]).toMatchObject({ source: "klipy", id: "happy-cat", src: "https://static.klipy.com/cat.gif" });
      expect(filterGifs({ data: [item] }, { quality: "sm", format: "webm" })).toEqual([]);
   });

   test("rejects unsuccessful provider responses for both media types", async () => {
      globalThis.fetch = mock(async () => Response.json({ result: false, data: null })) as unknown as typeof fetch;
      await expect(fetchTrendingGifs("1")).rejects.toThrow("Invalid Klipy response");
      await expect(fetchStickers("1")).rejects.toThrow("Invalid Klipy response");
   });
});

describe("sticker routes and CDN", () => {
   test("require authentication on catalog, library, and uploads", async () => {
      for (const path of ["/api/stickers/trending", "/api/users/@me/stickers"]) {
         expect((await api.handle(new Request(`http://localhost${path}`))).status).toBe(401);
      }
      const form = new FormData();
      form.append("files[0]", new Blob(["test"]), "test.png");
      expect((await api.handle(new Request("http://localhost/api/stickers", { method: "POST", body: form }))).status).toBe(401);
      expect((await cdn.handle(new Request("http://localhost/cdn/stickers/123", { method: "POST", body: form }))).status).toBe(401);
   });

   test("searches Klipy with encoded terms and pagination", async () => {
      const response = await api.handle(new Request("http://localhost/api/stickers/search?query=cats%20%26%20dogs&limit=24&page=2", { headers }));
      expect(response.status).toBe(200);
      expect((await response.json())[0]).toMatchObject({ id: "happy-cat", source: "klipy", src: "https://static.klipy.com/cat.webp" });
      const url = new URL(String(providerFetch.mock.calls[0][0]));
      expect(url.searchParams.get("q")).toBe("cats & dogs");
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("customer_id")).toBe("1");
   });

   test("rejects invalid pagination before contacting Klipy", async () => {
      expect((await api.handle(new Request("http://localhost/api/stickers/trending?limit=500&page=-1", { headers }))).status).toBe(422);
      expect(providerFetch).not.toHaveBeenCalled();
   });

   test("scopes the searchable library to the authenticated user", async () => {
      await api.handle(new Request("http://localhost/api/users/@me/stickers?query=wave&page=2&limit=24", { headers }));
      expect(findMany.mock.calls[0][0]).toEqual({
         where: { userId: 1n, title: { contains: "wave", mode: "insensitive" } },
         orderBy: { id: "desc" },
         take: 24,
         skip: 24,
      });
   });

   test("uploads an image to CDN, persists metadata, and serves it without authentication", async () => {
      const png = await Bun.file(new URL("./pixel.png", import.meta.url)).arrayBuffer();
      const form = new FormData();
      form.append("files[0]", new Blob([new Uint8Array(png)]), "wave.png");
      const response = await api.handle(new Request("http://localhost/api/stickers", { method: "POST", headers, body: form }));
      expect(response.status).toBe(201);
      const sticker = await response.json();
      expect(sticker).toMatchObject({ source: "custom", title: "wave", width: 1, height: 1 });
      expect(rows.get(BigInt(sticker.id))?.userId).toBe(1n);
      const asset = await cdn.handle(new Request(`http://localhost/cdn/${sticker.src}`));
      expect(asset.status).toBe(200);
      expect(asset.headers.get("content-type")).toBe("image/webp");
      expect(
         Buffer.from(await asset.arrayBuffer())
            .subarray(0, 4)
            .toString(),
      ).toBe("RIFF");
      expect(await resolveSticker({ source: "custom", id: sticker.id })).toMatchObject({ src: sticker.src, width: 1, height: 1 });
   });

   test("rejects disguised files without saving sticker metadata", async () => {
      const form = new FormData();
      form.append("files[0]", new Blob(["not a real image"], { type: "image/png" }), "fake.png");
      const result = await api.handle(new Request("http://localhost/api/stickers", { method: "POST", headers, body: form }));
      expect(result.status).toBe(400);
      expect((await result.json()).message).toBe("Invalid File Format");
      expect(rows.size).toBe(0);
      expect(files.size).toBe(0);
   });

   test("only owners can remove stickers and existing message assets remain", async () => {
      const sticker = { id: 123n, userId: 2n, title: "Wave", asset: "stickers/123.webp", width: 20, height: 10 };
      rows.set(123n, sticker);
      files.set("123.webp", new Blob(["existing sticker"]));
      const request = () => new Request("http://localhost/api/users/@me/stickers/123", { method: "DELETE", headers });
      expect((await api.handle(request())).status).toBe(404);
      sticker.userId = 1n;
      expect((await api.handle(request())).status).toBe(204);
      expect(files.has("123.webp")).toBe(true);
   });

   test("handles missing or malformed custom sticker references", async () => {
      expect(await resolveSticker({ source: "custom", id: "bad" })).toBeUndefined();
      expect(await resolveSticker({ source: "custom", id: "999" })).toBeUndefined();
   });

   test("surfaces provider failures", async () => {
      globalThis.fetch = mock(async () => new Response("Unavailable", { status: 503 })) as unknown as typeof fetch;
      await expect(fetchStickers("1")).rejects.toThrow("503");
   });

   test("preserves structured errors from CDN responses", async () => {
      const error = { code: 2008, message: "File too large" };
      globalThis.fetch = mock(async () => Response.json(error, { status: 400 })) as unknown as typeof fetch;
      await expect(upstreamRequest({ root: "http://localhost/cdn", fullRoute: "/stickers/123", method: "POST", throw: true })).rejects.toMatchObject({
         rawError: error,
         code: 2008,
         status: 400,
      });
   });

   test("sends custom stickers using stored assets and dimensions", async () => {
      rows.set(123n, { id: 123n, userId: 1n, title: "Wave", asset: "stickers/123.webp", width: 20, height: 10 });
      const response = await api.handle(
         new Request("http://localhost/api/channels/10/messages", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ stickers: [{ source: "custom", id: "123" }] }),
         }),
      );
      expect(response.status).toBe(201);
      const message = await response.json();
      expect(message.stickers[0]).toMatchObject({ source: "custom", id: "123", src: "stickers/123.webp", width: 20, height: 10 });
      expect(message.embeds).toEqual([]);
   });

   test("validates Klipy stickers before creating a message", async () => {
      const response = await api.handle(
         new Request("http://localhost/api/channels/10/messages", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ stickers: [{ source: "klipy", id: "happy-cat" }] }),
         }),
      );
      expect(response.status).toBe(201);
      expect((await response.json()).stickers[0].src).toBe("https://static.klipy.com/cat.webp");
      const url = new URL(String(providerFetch.mock.calls[0][0]));
      expect(url.pathname).toEndWith("/stickers/items");
      expect(url.searchParams.get("slugs")).toBe("happy-cat");
   });

   test("sends searched stickers when item lookup returns a canonical slug", async () => {
      const searchSlug = "happy-cat--6914457558367152";
      const fetchSticker = mock(async (input: string | URL | Request) => {
         const url = new URL(String(input));
         const item = url.pathname.endsWith("/search") ? { ...providerItem, slug: searchSlug } : providerItem;
         return Response.json({ result: true, data: { data: [item] } });
      });
      globalThis.fetch = fetchSticker as unknown as typeof fetch;

      const search = await api.handle(new Request("http://localhost/api/stickers/search?query=happy", { headers }));
      const [sticker] = await search.json();
      expect(sticker.id).toBe(searchSlug);
      const response = await api.handle(
         new Request("http://localhost/api/channels/10/messages", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ stickers: [{ source: sticker.source, id: sticker.id }] }),
         }),
      );

      expect(response.status).toBe(201);
      expect((await response.json()).stickers[0]).toMatchObject({ id: "happy-cat", src: providerItem.file.sm.webp.url });
      const lookupUrl = new URL(String(fetchSticker.mock.calls[1][0]));
      expect(lookupUrl.searchParams.get("slugs")).toBe(searchSlug);
   });

   test("rejects a Klipy sticker that item lookup cannot resolve", async () => {
      globalThis.fetch = mock(async () => Response.json({ result: true, data: { data: [] } })) as unknown as typeof fetch;
      const response = await api.handle(
         new Request("http://localhost/api/channels/10/messages", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ stickers: [{ source: "klipy", id: "missing--6914457558367152" }] }),
         }),
      );
      expect(response.status).toBe(400);
      expect(createMessage).not.toHaveBeenCalled();
   });

   test("rejects missing stickers without creating a message", async () => {
      const response = await api.handle(
         new Request("http://localhost/api/channels/10/messages", {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ stickers: [{ source: "custom", id: "999" }] }),
         }),
      );
      expect(response.status).toBe(400);
      expect(createMessage).not.toHaveBeenCalled();
   });
});
