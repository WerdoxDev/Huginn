import { ExpressionType, type APIExpression, type GatewayExpressionUpdatedData } from "@huginnjs/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ExpressionsProvider from "./ExpressionsProvider";

const mocks = vi.hoisted(() => ({
   listeners: new Map<string, (data: GatewayExpressionUpdatedData) => void>(),
   unlisten: vi.fn(),
}));

vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => ({
      gateway: {
         listen: (event: string, listener: (data: GatewayExpressionUpdatedData) => void) => {
            mocks.listeners.set(event, listener);
            return () => {
               mocks.listeners.delete(event);
               mocks.unlisten(event);
            };
         },
      },
   }),
}));

vi.mock("@stores/userStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/userStore")>()),
   useThisUser: () => ({ user: { id: "user-1" } }),
}));

function expression(id: string, usageCount = 0, lastUsedAt: string | null = null): APIExpression {
   return {
      id,
      type: ExpressionType.KLIPY,
      title: id,
      url: "https://example.com/media",
      src: "https://example.com/media",
      width: 100,
      height: 100,
      contentType: "image/gif",
      usageCount,
      lastUsedAt,
   };
}

function setup() {
   const cache = new QueryClient();
   const invalidate = vi.spyOn(cache, "invalidateQueries");
   const rendered = render(
      <QueryClientProvider client={cache}>
         <ExpressionsProvider />
      </QueryClientProvider>,
   );
   return {
      cache,
      invalidate,
      ...rendered,
      dispatch: (data: GatewayExpressionUpdatedData) => mocks.listeners.get("expression_update")!(data),
   };
}

describe("ExpressionsProvider", () => {
   beforeEach(() => {
      mocks.listeners.clear();
      mocks.unlisten.mockClear();
   });

   it("updates one GIF and reorders by usage and recency without invalidating either collection", () => {
      const { cache, invalidate, dispatch } = setup();
      const first = expression("first", 3, "2026-11-14T12:00:00.000Z");
      const second = expression("second", 2, "2026-11-13T12:00:00.000Z");
      const third = expression("third", 4);
      cache.setQueryData(["expressions", "user-1", "gifs"], [third, first, second]);
      cache.setQueryData(["expressions", "user-1", "stickers"], [second]);
      cache.setQueryData(["expressions", "user-2", "gifs"], [second]);
      const updated = { ...second, usageCount: 3, lastUsedAt: "2026-11-15T12:00:00.000Z" };

      dispatch({ kind: "gifs", expression: updated });

      expect(cache.getQueryData(["expressions", "user-1", "gifs"])).toEqual([third, updated, first]);
      expect(cache.getQueryData(["expressions", "user-1", "stickers"])).toEqual([second]);
      expect(cache.getQueryData(["expressions", "user-2", "gifs"])).toEqual([second]);
      expect(invalidate).not.toHaveBeenCalled();
   });

   it("inserts a newly used sticker into a loaded collection and handles replay without duplicates", () => {
      const { cache, dispatch } = setup();
      const unused = expression("unused");
      const updated = expression("new", 1, "2026-11-15T12:00:00.000Z");
      cache.setQueryData(["expressions", "user-1", "stickers"], [unused]);

      dispatch({ kind: "stickers", expression: updated });
      dispatch({ kind: "stickers", expression: updated });

      expect(cache.getQueryData(["expressions", "user-1", "stickers"])).toEqual([updated, unused]);
   });

   it("matches both the expression ID and its source type", () => {
      const { cache, dispatch } = setup();
      const klipy = expression("123", 2);
      const uploaded = { ...expression("123"), type: ExpressionType.UPLOADED };
      cache.setQueryData(["expressions", "user-1", "gifs"], [klipy, uploaded]);
      const updated = { ...uploaded, usageCount: 1 };

      dispatch({ kind: "gifs", expression: updated });

      expect(cache.getQueryData(["expressions", "user-1", "gifs"])).toEqual([klipy, updated]);
   });

   it("leaves unloaded collections unfetched so a later mount can load the complete list", () => {
      const { cache, dispatch } = setup();

      dispatch({ kind: "gifs", expression: expression("new", 1) });

      expect(cache.getQueryData(["expressions", "user-1", "gifs"])).toBeUndefined();
   });

   it("unsubscribes on unmount", () => {
      const { unmount } = setup();
      expect(mocks.listeners.has("expression_update")).toBe(true);

      unmount();

      expect(mocks.unlisten).toHaveBeenCalledWith("expression_update");
      expect(mocks.listeners.size).toBe(0);
   });
});
