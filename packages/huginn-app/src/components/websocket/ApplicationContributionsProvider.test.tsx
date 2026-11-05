import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ApplicationContributionsProvider from "./ApplicationContributionsProvider";

const mocks = vi.hoisted(() => ({
   listeners: new Map<string, () => Promise<void>>(),
   unlisten: vi.fn(),
   updateCatalog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => ({
      gateway: {
         listen: (event: string, listener: () => Promise<void>) => {
            mocks.listeners.set(event, listener);
            return () => {
               mocks.listeners.delete(event);
               mocks.unlisten(event);
            };
         },
      },
   }),
}));

vi.mock("@stores/storageStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/storageStore")>()),
   updateApplicationCatalog: mocks.updateCatalog,
}));

describe("ApplicationContributionsProvider", () => {
   it("refreshes the catalog for staff edits without requiring a contribution and unsubscribes on unmount", async () => {
      const queryClient = new QueryClient();
      const { unmount } = render(
         <QueryClientProvider client={queryClient}>
            <ApplicationContributionsProvider />
         </QueryClientProvider>,
      );
      const listener = mocks.listeners.get("application_catalog_update");
      expect(listener).toBeDefined();
      await listener!();
      expect(mocks.updateCatalog).toHaveBeenCalledTimes(1);
      unmount();
      expect(mocks.unlisten).toHaveBeenCalledWith("application_catalog_update");
      expect(mocks.listeners.size).toBe(0);
   });
});
