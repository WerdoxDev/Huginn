import type { APIExpression, GatewayExpressionUpdatedData } from "@huginnjs/shared";
import type { PropsWithChildren } from "react";

import { useExpressions } from "@hooks/useExpressions";
import { EventEmitter, ExpressionType } from "@huginnjs/shared";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExpressionsProvider from "./ExpressionsProvider";

const mocks = vi.hoisted(() => ({
   user: { id: "user-1" } as { id: string } | undefined,
   client: undefined as unknown as ReturnType<typeof createClient>,
}));

vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => mocks.client,
}));
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ user: mocks.user }) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ showError: vi.fn() }) }));

const collections = new Map<string, APIExpression[]>();
const caches: QueryClient[] = [];

function createClient() {
   return {
      gateway: new EventEmitter<{ expression_update: GatewayExpressionUpdatedData }>(),
      gifs: { getAll: vi.fn(async () => [...(collections.get(mocks.user!.id) ?? [])]) },
   };
}

function expression(id: string, usageCount = 0): APIExpression {
   return {
      id,
      type: ExpressionType.KLIPY,
      title: id,
      url: `https://klipy.com/gifs/${id}`,
      src: `https://example.com/${id}.gif`,
      width: 100,
      height: 100,
      contentType: "image/gif",
      usageCount,
   };
}

function setup() {
   const cache = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
   caches.push(cache);
   const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={cache}>{children}</QueryClientProvider>;
   const provider = render(<ExpressionsProvider />, { wrapper });
   return { ...provider, observe: () => renderHook(() => useExpressions("gifs"), { wrapper }) };
}

describe("ExpressionsProvider lifecycle", () => {
   beforeEach(() => {
      mocks.user = { id: "user-1" };
      mocks.client = createClient();
      collections.clear();
   });

   afterEach(() => {
      for (const cache of caches.splice(0)) cache.clear();
   });

   it("receives updates while no save control or picker is mounted without fetching collections itself", async () => {
      const saved = expression("cat");
      collections.set("user-1", [saved]);
      const { observe } = setup();
      expect(mocks.client.gifs.getAll).not.toHaveBeenCalled();
      const first = observe();
      await waitFor(() => expect(first.result.current.items).toEqual([saved]));
      first.unmount();
      const updated = { ...saved, usageCount: 1 };

      act(() => mocks.client.gateway.emit("expression_update", { kind: "gifs", expression: updated }));

      const later = observe();
      await waitFor(() => expect(later.result.current.items).toEqual([updated]));
      expect(later.result.current.find(saved)).toEqual(updated);
      expect(mocks.client.gifs.getAll).toHaveBeenCalledTimes(1);
   });

   it("stops delivering updates after unmount", async () => {
      const saved = expression("cat");
      collections.set("user-1", [saved]);
      const { unmount, observe } = setup();
      const first = observe();
      await waitFor(() => expect(first.result.current.items).toEqual([saved]));
      const updated = { ...saved, usageCount: 1 };
      act(() => mocks.client.gateway.emit("expression_update", { kind: "gifs", expression: updated }));
      await waitFor(() => expect(first.result.current.items).toEqual([updated]));

      unmount();
      act(() => mocks.client.gateway.emit("expression_update", { kind: "gifs", expression: { ...saved, usageCount: 2 } }));

      const later = observe();
      expect(later.result.current.items).toEqual([updated]);
      expect(mocks.client.gifs.getAll).toHaveBeenCalledTimes(1);
   });

   it("delivers events only to the current user's collection after switching users", async () => {
      const firstUserGif = expression("first-user");
      const secondUserGif = expression("second-user");
      collections.set("user-1", [firstUserGif]);
      collections.set("user-2", [secondUserGif]);
      const { rerender, observe } = setup();
      const collection = observe();
      await waitFor(() => expect(collection.result.current.items).toEqual([firstUserGif]));

      mocks.user = { id: "user-2" };
      rerender(<ExpressionsProvider />);
      collection.rerender();
      await waitFor(() => expect(collection.result.current.items).toEqual([secondUserGif]));
      const updated = { ...secondUserGif, usageCount: 1 };
      act(() => mocks.client.gateway.emit("expression_update", { kind: "gifs", expression: updated }));
      await waitFor(() => expect(collection.result.current.items).toEqual([updated]));

      mocks.user = { id: "user-1" };
      rerender(<ExpressionsProvider />);
      collection.rerender();
      await waitFor(() => expect(collection.result.current.items).toEqual([firstUserGif]));
      expect(mocks.client.gifs.getAll).toHaveBeenCalledTimes(2);
   });
});
