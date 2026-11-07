import { storageStore } from "@stores/storageStore";
import { windowStore } from "@stores/windowStore";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";

import ApplicationOverlayButton from "./ApplicationOverlayButton";

afterEach(() => {
   windowStore.setState({ environment: "browser" });
});

describe("application overlay button", () => {
   test("persists a per-game toggle and updates every button for the same game", async () => {
      windowStore.setState({ environment: "desktop" });
      render(
         <>
            <ApplicationOverlayButton applicationKey="known:7" />
            <ApplicationOverlayButton applicationKey="known:7" />
            <ApplicationOverlayButton applicationKey="custom:/custom.exe" />
         </>,
      );

      expect(screen.getAllByRole("button", { name: "Disable overlay" })).toHaveLength(3);
      await act(async () => {
         fireEvent.click(screen.getAllByRole("button", { name: "Disable overlay" })[0]);
      });
      expect(screen.getAllByRole("button", { name: "Enable overlay", pressed: false })).toHaveLength(2);
      expect(screen.getAllByRole("button", { name: "Disable overlay", pressed: true })).toHaveLength(1);
      expect((await storageStore.getState().storage.loadFile("application-preferences")).data).toEqual({ "known:7": { overlayEnabled: false } });

      await act(async () => {
         fireEvent.click(screen.getAllByRole("button", { name: "Enable overlay" })[1]);
      });
      expect(screen.getAllByRole("button", { name: "Disable overlay", pressed: true })).toHaveLength(3);
      expect((await storageStore.getState().storage.loadFile("application-preferences")).data["known:7"]?.overlayEnabled ?? true).toBe(true);
   });

   test("hides desktop overlay controls in the browser", () => {
      windowStore.setState({ environment: "browser" });
      render(<ApplicationOverlayButton applicationKey="known:7" />);
      expect(screen.queryByRole("button")).toBeNull();
   });
});
