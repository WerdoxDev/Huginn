import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { broadcastQueryClient } from "./broadcast-query-client";

const cleanups: Array<() => void> = [];

afterEach(() => {
   for (const cleanup of cleanups.splice(0).reverse()) cleanup();
   vi.restoreAllMocks();
});

function createWindows() {
   const main = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
   const overlay = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
   const broadcastChannel = `query-sync-test:${crypto.randomUUID()}`;
   cleanups.push(
      () => main.clear(),
      () => overlay.clear(),
   );
   const start = () => {
      const stopMain = broadcastQueryClient({ queryClient: main, broadcastChannel });
      const stopOverlay = broadcastQueryClient({ queryClient: overlay, broadcastChannel });
      cleanups.push(stopMain, stopOverlay);
      return { stopMain, stopOverlay };
   };
   return { main, overlay, start };
}

test("opening an overlay with an empty user query preserves loaded channel recipients", async () => {
   const { main, overlay, start } = createWindows();
   const key = ["user", "alice"];
   const alice = { id: "alice", username: "alice", displayName: "Alice" };
   main.setQueryData(key, alice);
   const observer = new QueryObserver(main, { queryKey: key, enabled: false });
   const onChange = vi.fn();
   cleanups.push(observer.subscribe(onChange));
   start();

   // Overlay useQuery creates a pending entry before persistence or its bridge request resolves.
   overlay.getQueryCache().build(overlay, { queryKey: key });
   overlay.setQueryData(["overlay-ready"], true);
   await waitFor(() => expect(main.getQueryData(["overlay-ready"])).toBe(true));

   expect(main.getQueryData(key)).toEqual(alice);
   expect(main.getQueryState(key)?.status).toBe("success");
   expect(onChange).not.toHaveBeenCalled();
});

test("restoring an older child query does not replace newer host data", async () => {
   const { main, overlay, start } = createWindows();
   const key = ["user", "alice"];
   main.setQueryData(key, { displayName: "Alice updated" }, { updatedAt: 200 });
   start();

   overlay.getQueryCache().build(overlay, { queryKey: key, initialData: { displayName: "Alice" }, initialDataUpdatedAt: 100 });
   overlay.setQueryData(["overlay-ready"], true);
   await waitFor(() => expect(main.getQueryData(["overlay-ready"])).toBe(true));

   expect(main.getQueryData(key)).toEqual({ displayName: "Alice updated" });
});

test("successful query data continues to sync in both directions", async () => {
   const { main, overlay, start } = createWindows();
   const key = ["user", "alice"];
   start();

   main.setQueryData(key, { displayName: "Alice" }, { updatedAt: 100 });
   await waitFor(() => expect(overlay.getQueryData(key)).toEqual({ displayName: "Alice" }));
   overlay.setQueryData(key, { displayName: "Alice updated" }, { updatedAt: 200 });
   await waitFor(() => expect(main.getQueryData(key)).toEqual({ displayName: "Alice updated" }));
});

test("successful initial data is shared with a window that has no cached query", async () => {
   const { main, overlay, start } = createWindows();
   start();
   main.getQueryCache().build(main, { queryKey: ["user", "alice"], initialData: { displayName: "Alice" } });
   await waitFor(() => expect(overlay.getQueryData(["user", "alice"])).toEqual({ displayName: "Alice" }));
});

test("explicitly removing an observed query still removes it from other windows", async () => {
   const { main, overlay, start } = createWindows();
   const key = ["user", "alice"];
   start();
   main.setQueryData(key, { displayName: "Alice" });
   await waitFor(() => expect(overlay.getQueryData(key)).toEqual({ displayName: "Alice" }));
   const observer = new QueryObserver(main, { queryKey: key, enabled: false });
   cleanups.push(observer.subscribe(() => {}));

   main.removeQueries({ queryKey: key });
   await waitFor(() => expect(overlay.getQueryState(key)).toBeUndefined());
});

test("a child discarding an unused query does not clear the host's recipients", async () => {
   const { main, overlay, start } = createWindows();
   const key = ["user", "alice"];
   start();
   main.setQueryData(key, { displayName: "Alice" });
   await waitFor(() => expect(overlay.getQueryData(key)).toEqual({ displayName: "Alice" }));

   overlay.removeQueries({ queryKey: key });
   overlay.setQueryData(["overlay-ready"], true);
   await waitFor(() => expect(main.getQueryData(["overlay-ready"])).toBe(true));

   expect(main.getQueryData(key)).toEqual({ displayName: "Alice" });
});

test("remote data does not stop a local fetch or mark an idle peer as fetching", async () => {
   const { main, overlay, start } = createWindows();
   const key = ["user", "alice"];
   main.setQueryData(key, { displayName: "Alice" }, { updatedAt: 100 });
   start();
   const result = Promise.withResolvers<{ displayName: string }>();
   const fetch = main.fetchQuery({ queryKey: key, queryFn: () => result.promise });

   try {
      overlay.setQueryData(key, { displayName: "Remote Alice" }, { updatedAt: 200 });
      await waitFor(() => expect(main.getQueryData(key)).toEqual({ displayName: "Remote Alice" }));
      expect(main.getQueryState(key)?.fetchStatus).toBe("fetching");

      // Manual cache writes can happen while the sender is still fetching.
      main.setQueryData(key, { displayName: "Local Alice" }, { updatedAt: 300 });
      await waitFor(() => expect(overlay.getQueryData(key)).toEqual({ displayName: "Local Alice" }));
      expect(overlay.getQueryState(key)?.fetchStatus).toBe("idle");
   } finally {
      result.resolve({ displayName: "Fetched Alice" });
      await fetch;
   }
});
