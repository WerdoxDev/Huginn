import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { storageStore } from "@stores/storageStore";

import SettingsSystemTab from "./SettingsSystemTab";

const mocks = vi.hoisted(() => ({ environment: "desktop", setAutostart: vi.fn() }));

vi.mock("@stores/windowStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/windowStore")>()),
   useHuginnWindow: () => ({ environment: mocks.environment }),
}));

beforeEach(() => {
   mocks.environment = "desktop";
   mocks.setAutostart.mockReset().mockResolvedValue(undefined);
   // Keep the real local storage adapter so this verifies persistence too.
   Object.defineProperty(window, "electronAPI", { configurable: true, value: { setAutostart: mocks.setAutostart, setProxy: vi.fn() } });
});

afterEach(() => {
   Reflect.deleteProperty(window, "electronAPI");
});

describe("System settings", () => {
   it("persists disabled autostart and restores it when the page reopens", async () => {
      const { unmount } = render(<SettingsSystemTab />);
      fireEvent.click(screen.getByRole("switch", { name: "Start Huginn at Login" }));
      await waitFor(() => expect(storageStore.getState().cache.settings.autostart).toBe(false));
      expect(mocks.setAutostart).toHaveBeenCalledWith(false);
      expect(JSON.parse(localStorage.getItem("settings")!).autostart).toBe(false);
      unmount();
      render(<SettingsSystemTab />);
      expect(screen.getByRole("switch", { name: "Start Huginn at Login" }).hasAttribute("data-checked")).toBe(false);
      fireEvent.click(screen.getByRole("switch", { name: "Start Huginn at Login" }));
      await waitFor(() => expect(storageStore.getState().cache.settings.autostart).toBe(true));
      expect(mocks.setAutostart).toHaveBeenLastCalledWith(true);
   });

   it("keeps the saved preference and shows an error when the OS rejects the change", async () => {
      mocks.setAutostart.mockRejectedValue(new Error("Access denied"));
      render(<SettingsSystemTab />);
      fireEvent.click(screen.getByRole("switch", { name: "Start Huginn at Login" }));
      expect((await screen.findByRole("alert")).textContent).toContain("Could not update autostart");
      expect(storageStore.getState().cache.settings.autostart).toBe(true);
   });

   it("saves the existing system proxy preference from this page", async () => {
      render(<SettingsSystemTab />);
      fireEvent.click(screen.getByRole("switch", { name: "Use System Proxy" }));
      await waitFor(() => expect(storageStore.getState().cache.settings.useProxy).toBe(false));
      expect(JSON.parse(localStorage.getItem("settings")!).useProxy).toBe(false);
   });

   it("preserves proxy changes made while autostart is being applied", async () => {
      let finish!: () => void;
      mocks.setAutostart.mockReturnValue(
         new Promise<void>((resolve) => {
            finish = resolve;
         }),
      );
      render(<SettingsSystemTab />);
      const autostart = screen.getByRole("switch", { name: "Start Huginn at Login" });
      fireEvent.click(autostart);
      expect(autostart.hasAttribute("disabled")).toBe(true);
      fireEvent.click(screen.getByRole("switch", { name: "Use System Proxy" }));
      await waitFor(() => expect(storageStore.getState().cache.settings.useProxy).toBe(false));
      finish();
      await waitFor(() => expect(storageStore.getState().cache.settings.autostart).toBe(false));
      expect(storageStore.getState().cache.settings.useProxy).toBe(false);
   });

   it.each(["browser", "android"])("explains desktop availability on %s", (environment) => {
      mocks.environment = environment;
      render(<SettingsSystemTab />);
      expect(screen.queryByRole("switch")).toBeNull();
      expect(screen.getByText("System settings are available in the desktop app.")).toBeTruthy();
   });
});
