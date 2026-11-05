import type { APIContribution, APIGetApplicationCatalogResult } from "@huginnjs/shared";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SettingsContributionTab from "./SettingsContributionTab";

const mocks = vi.hoisted(() => ({
   isMobile: false,
   contributions: [] as APIContribution[],
   catalog: { games: [], matchers: [] } as Pick<APIGetApplicationCatalogResult, "games" | "matchers">,
}));

vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock("@hooks/mutations/useContributeApplication", () => ({ useContributeApplication: () => ({ isPending: false }) }));
vi.mock("@components/profile/ProfileComponents", () => ({ ProfileActivity: () => null }));
vi.mock("@stores/presenceStore", () => ({ usePresenceStore: () => ({ session: { activities: [] } }) }));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: vi.fn() }) }));
vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => ({ cdn: { applicationIcon: (id: number, hash: string) => `/application-icons/${id}/${hash}.webp` } }),
}));
vi.mock("@stores/userStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/userStore")>()),
   useThisUser: () => ({ user: undefined }),
}));
vi.mock("@stores/storageStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/storageStore")>()),
   useStorage: () => mocks.catalog,
}));
vi.mock("@stores/windowStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/windowStore")>()),
   useHuginnWindow: () => ({ environment: "browser" }),
}));
vi.mock("@tanstack/react-query", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@tanstack/react-query")>()),
   useQuery: (options: { queryKey: string[] }) => ({
      data: options.queryKey[0] === "application-contributions" ? mocks.contributions : undefined,
   }),
}));

function contribution(id: number, status: APIContribution["status"], createdAt: string): APIContribution {
   return {
      id,
      contributorId: "1",
      knownGameId: null,
      applicationMatcherId: null,
      windowTitle: `Application ${id}`,
      cleanedWindowTitle: `application ${id}`,
      exePath: `app${id}`,
      commandLine: null,
      platform: "linux",
      iconHash: null,
      createdAt,
      status,
   };
}

function visibleApplications() {
   return screen.queryAllByText(/^Application \d$/).map((element) => element.textContent);
}

beforeEach(() => {
   mocks.isMobile = false;
   mocks.catalog = { games: [], matchers: [] };
   mocks.contributions = [
      contribution(1, "accepted", "2026-10-20T12:00:00Z"),
      contribution(3, "rejected", "2026-10-22T12:00:00Z"),
      contribution(2, "pending", "2026-10-21T12:00:00Z"),
   ];
   vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
   );
});

afterEach(() => vi.unstubAllGlobals());

describe("contribution icons", () => {
   beforeEach(() => {
      mocks.catalog = {
         games: [{ id: 7, igdbId: 42, canonicalName: "Shared game", aliases: [], createdAt: "2026-01-01", updatedAt: null }],
         matchers: ["global-icon", "regional-icon"].map((iconHash, index) => ({
            id: index + 1,
            knownGameId: 7,
            iconHash,
            exeNames: [],
            windowTitles: [],
            commandLinePatterns: [],
            platform: "linux",
            status: "verified",
            verificationMethod: "manual",
            createdAt: "2026-01-01",
            updatedAt: null,
         })),
      };
      mocks.contributions = [1, 2].map((id) => ({
         ...contribution(id, "accepted", "2026-10-20"),
         knownGameId: 7,
         applicationMatcherId: id,
         iconHash: "submitted-icon",
      }));
   });

   it("shows separate matcher icons for contributions to the same game", () => {
      const { container, rerender } = render(<SettingsContributionTab />);
      expect([...container.querySelectorAll("img")].map((image) => image.getAttribute("src"))).toEqual([
         "/application-icons/7/global-icon.webp",
         "/application-icons/7/regional-icon.webp",
      ]);

      mocks.catalog = {
         ...mocks.catalog,
         matchers: mocks.catalog.matchers.map((matcher) => ({ ...matcher, iconHash: `${matcher.iconHash}-updated` })),
      };
      rerender(<SettingsContributionTab />);
      expect([...container.querySelectorAll("img")].map((image) => image.getAttribute("src"))).toEqual([
         "/application-icons/7/global-icon-updated.webp",
         "/application-icons/7/regional-icon-updated.webp",
      ]);
   });

   it.each(["no icon", "missing matcher"])("does not use submission icons for accepted contributions with %s", (state) => {
      mocks.catalog.matchers = state === "missing matcher" ? [] : mocks.catalog.matchers.map((matcher) => ({ ...matcher, iconHash: null }));
      const { container } = render(<SettingsContributionTab />);
      expect(container.querySelectorAll("img")).toHaveLength(0);
   });

   it("shows a pending contribution's icon from its own storage directory", () => {
      mocks.contributions = [{ ...contribution(9, "pending", "2026-10-20"), iconHash: "submitted-icon" }];
      const { container } = render(<SettingsContributionTab />);
      expect(container.querySelector("img")?.getAttribute("src")).toBe("/application-icons/9/submitted-icon.webp");
   });
});

describe("contribution sorting and filtering", () => {
   it("sorts by submission date without changing the cached contributions", async () => {
      const user = userEvent.setup();
      render(<SettingsContributionTab />);
      expect(visibleApplications()).toEqual(["Application 3", "Application 2", "Application 1"]);

      await user.click(screen.getByRole("button", { name: "Sort contributions: Newest first" }));
      await user.click(await screen.findByRole("menuitem", { name: "Oldest first" }));

      expect(visibleApplications()).toEqual(["Application 1", "Application 2", "Application 3"]);
      expect(mocks.contributions.map(({ id }) => id)).toEqual([1, 3, 2]);
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
   });

   it.each([false, true])("keeps multi-select open and shows an active indicator (mobile: %s)", async (isMobile) => {
      mocks.isMobile = isMobile;
      const user = userEvent.setup();
      render(<SettingsContributionTab />);
      const trigger = screen.getByRole("button", { name: "Filter contributions by status" });
      await user.click(trigger);
      const role = isMobile ? "checkbox" : "menuitemcheckbox";
      const accepted = await screen.findByRole(role, { name: "Accepted" });
      await user.click(accepted);
      expect(accepted.getAttribute("aria-checked")).toBe("true");
      expect(visibleApplications()).toEqual(["Application 1"]);
      expect(trigger.getAttribute("aria-label")).toContain("filters active");
      expect(trigger.querySelector(".bg-primary-500")).not.toBeNull();

      await user.click(screen.getByRole(role, { name: "Pending" }));
      expect(visibleApplications()).toEqual(["Application 2", "Application 1"]);
      await user.click(screen.getByRole(role, { name: "Accepted" }));
      expect(visibleApplications()).toEqual(["Application 2"]);
      await user.click(screen.getByRole(role, { name: "Pending" }));
      expect(visibleApplications()).toEqual(["Application 3", "Application 2", "Application 1"]);
      expect(trigger.querySelector(".bg-primary-500")).toBeNull();

      await user.click(screen.getByRole(role, { name: "Rejected" }));
      expect(visibleApplications()).toEqual(["Application 3"]);
   });

   it("distinguishes an empty status filter from having no contributions", async () => {
      mocks.contributions = [contribution(1, "accepted", "2026-10-20T12:00:00Z")];
      const { rerender } = render(<SettingsContributionTab />);
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Filter contributions by status" }));
      await user.click(await screen.findByRole("menuitemcheckbox", { name: "Pending" }));
      expect(screen.getByText("No contributions match the selected statuses.")).toBeTruthy();
      fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
      mocks.contributions = [];
      rerender(<SettingsContributionTab />);
      expect(screen.getByText("No applications contributed...")).toBeTruthy();
   });
});
