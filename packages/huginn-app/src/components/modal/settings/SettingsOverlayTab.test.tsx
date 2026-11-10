import { storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import SettingsOverlayTab from "./SettingsOverlayTab";

afterEach(() => windowStore.setState({ environment: "browser" }));

describe("Overlay settings", () => {
   test("persists both options and restores them when the tab reopens", async () => {
      windowStore.setState({ environment: "desktop" });
      const { unmount } = render(<SettingsOverlayTab />);
      expect(screen.getByRole("switch", { name: "Enable Overlay" }).hasAttribute("data-checked")).toBe(true);
      expect(screen.getByRole("switch", { name: "Only Show Users Who Are Talking" }).hasAttribute("data-checked")).toBe(false);

      fireEvent.click(screen.getByRole("switch", { name: "Enable Overlay" }));
      fireEvent.click(screen.getByRole("switch", { name: "Only Show Users Who Are Talking" }));
      await waitFor(() => {
         const saved = JSON.parse(localStorage.getItem("settings")!);
         expect(saved.overlayEnabled).toBe(false);
         expect(saved.voiceOverlayOnlySpeaking).toBe(true);
         expect(saved.theme).toBe(storageStore.getState().cache.settings.theme);
      });

      unmount();
      await storageStore.getState().getValue("settings");
      render(<SettingsOverlayTab />);
      expect(screen.getByRole("switch", { name: "Enable Overlay" }).hasAttribute("data-checked")).toBe(false);
      expect(screen.getByRole("switch", { name: "Only Show Users Who Are Talking" }).hasAttribute("data-checked")).toBe(true);
   });

   test.each(["browser", "android"] as const)("explains desktop availability on %s", (environment) => {
      windowStore.setState({ environment });
      render(<SettingsOverlayTab />);
      expect(screen.queryByRole("switch")).toBeNull();
      expect(screen.getByText("Overlay settings are available in the desktop app.")).toBeTruthy();
   });
});
