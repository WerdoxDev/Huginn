import { useConnect } from "@hooks/useConnect";
import { useCountdown } from "@hooks/useCountdown";
import { useUpdater } from "@hooks/useUpdater";
import { initializeClient, setHostnamesFromExternal, setHostnamesFromSettings, useClient } from "@stores/clientStore";
import { useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useNavigate } from "@tanstack/react-router";
import * as matchers from "@testing-library/jest-dom/matchers";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { IndexComponent, reducer } from "./index";
expect.extend(matchers);

// ---- presentational component stubs ----------------------------------------
// Keep these thin - we only care that props/children pass through, not styling.
vi.mock("@components/button/HuginnButton", () => ({
   default: ({ children, onClick, ...rest }: any) => (
      <button onClick={onClick} {...rest}>
         {children}
      </button>
   ),
}));
vi.mock("@components/HuginnIcon", () => ({ default: () => <div data-testid="huginn-icon" /> }));
vi.mock("@components/LoadingIcon", () => ({ default: () => <div data-testid="loading-icon" /> }));
vi.mock("@components/StartWrapper", () => ({
   default: ({ children }: any) => <div>{children}</div>,
}));

// IconMingcuteAlertLine is resolved via an auto-import icon plugin rather than an explicit
// import in the source file. Point this at whatever module your build actually maps it to
// (check your vite config / .vite cache), or add a global stub in your test setup instead.
vi.mock("~icons/mingcute/alert-line", () => ({ default: () => <div data-testid="alert-icon" /> }));

// ---- third-party deps --------------------------------------------------------
vi.mock("animejs", () => {
   const scope = {
      add: vi.fn(function (this: any) {
         return this;
      }),
      revert: vi.fn(),
   };
   return { animate: vi.fn(), createScope: vi.fn(() => scope) };
});

vi.mock("posthog-js/react", () => ({
   usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => {
   const actual = await importOriginal<typeof import("@tanstack/react-router")>();
   return { ...actual, useNavigate: vi.fn() };
});

// ---- app hooks/stores (auto-mocked - real exports replaced with vi.fn()) -----
vi.mock("@hooks/useConnect");
vi.mock("@hooks/useCountdown");
vi.mock("@hooks/useUpdater");
vi.mock("@stores/clientStore");
vi.mock("@stores/storageStore");
vi.mock("@stores/windowStore");

const navigateMock = vi.fn();

beforeEach(() => {
   vi.clearAllMocks();
   sessionStorage.clear();

   vi.mocked(useNavigate).mockReturnValue(navigateMock);
   vi.mocked(useCountdown).mockReturnValue({ startCountdown: vi.fn(), countdown: 0 });
   vi.mocked(useStorage).mockReturnValue({ hostnamePresets: [], activePresetName: undefined } as any);
   vi.mocked(useClient).mockReturnValue(undefined as any);
   vi.mocked(useHuginnWindow).mockReturnValue({ environment: "web", args: [] } as any);
   vi.mocked(useConnect).mockReturnValue(vi.fn());
   vi.mocked(useUpdater).mockImplementation(
      () =>
         ({
            checkAndDownload: vi.fn(),
            updateInfo: undefined,
            progress: 0,
            contentLength: { current: 0 },
            downloaded: { current: 0 },
         }) as any,
   );

   Object.defineProperty(window, "electronAPI", {
      value: { showMain: vi.fn() },
      writable: true,
      configurable: true,
   });
});

// ============================================================================
// Reducer - pure, no rendering needed
// ============================================================================
describe("reducer", () => {
   it("moves to in-progress on SET", () => {
      const state = reducer({ current: "none", status: "none", text: "" }, { type: "SET", step: "check_update", text: "Checking for updates..." });
      expect(state).toEqual({ current: "check_update", status: "in-progress", text: "Checking for updates..." });
   });

   it("keeps the current step but marks status as error on FAIL", () => {
      const state = reducer(
         { current: "check_update", status: "in-progress", text: "Checking for updates..." },
         { type: "FAIL", error: "network_error" },
      );
      expect(state.status).toBe("error");
      expect(state.current).toBe("check_update");
      expect(state.error).toBe("network_error");
   });
});

// ============================================================================
// Initial routing decision (the "none" step)
// ============================================================================
describe("initial step routing", () => {
   it("goes straight to fetch_hostnames when the active preset uses an external source", async () => {
      vi.mocked(setHostnamesFromExternal).mockResolvedValue({ success: true } as any);
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: true }));
      vi.mocked(useStorage).mockReturnValue({
         hostnamePresets: [{ name: "prod", hostnameSource: "external" }],
         activePresetName: "prod",
      } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("Fetching external hostnames...")).toBeInTheDocument());
   });

   it("checks for updates first on desktop", async () => {
      vi.mocked(useHuginnWindow).mockReturnValue({ environment: "desktop", args: [] } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("Checking for updates...")).toBeInTheDocument());
   });

   it("checks for updates first on android", async () => {
      vi.mocked(useHuginnWindow).mockReturnValue({ environment: "android", args: [] } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("Checking for updates...")).toBeInTheDocument());
   });

   it("connects directly on web (no hostname source, not desktop/android)", async () => {
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: true }));

      render(<IndexComponent />);

      await waitFor(() => expect(setHostnamesFromSettings).toHaveBeenCalled());
      await waitFor(() => expect(initializeClient).toHaveBeenCalled());
      await waitFor(() => expect(screen.getByText("Welcome undefined!")).toBeInTheDocument());
   });
});

// ============================================================================
// fetch_hostnames step
// ============================================================================
describe("fetch_hostnames step", () => {
   beforeEach(() => {
      vi.mocked(useStorage).mockReturnValue({
         hostnamePresets: [{ name: "prod", hostnameSource: "external" }],
         activePresetName: "prod",
      } as any);
   });

   it("moves on to check_update on desktop once hostnames resolve", async () => {
      vi.mocked(useHuginnWindow).mockReturnValue({ environment: "desktop", args: [] } as any);
      vi.mocked(setHostnamesFromExternal).mockResolvedValue({ success: true } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("Checking for updates...")).toBeInTheDocument());
      expect(initializeClient).toHaveBeenCalled();
   });

   it("shows an error state when the external hostname lookup fails", async () => {
      vi.mocked(setHostnamesFromExternal).mockResolvedValue({ success: false, status: "unreachable" } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText(/couldn't start huginn/i)).toBeInTheDocument());
      // note: "uppercase" is a CSS class, not a text transform applied to the string itself
      expect(screen.getByText("unreachable")).toBeInTheDocument();
   });
});

// ============================================================================
// check_update step
// ============================================================================
describe("check_update step", () => {
   beforeEach(() => {
      vi.mocked(useHuginnWindow).mockReturnValue({ environment: "desktop", args: [] } as any);
   });

   it("moves on to connecting when no update is available", async () => {
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: true }));
      vi.mocked(useUpdater).mockImplementation(
         (options: any) =>
            ({
               checkAndDownload: vi.fn(async () => options.onNotAvailable?.()),
               updateInfo: undefined,
               progress: 0,
               contentLength: { current: 0 },
               downloaded: { current: 0 },
            }) as any,
      );

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("Connecting...")).toBeInTheDocument());
   });

   it("shows the update step with the version while updating", async () => {
      vi.mocked(useUpdater).mockImplementation(
         (options: any) =>
            ({
               checkAndDownload: vi.fn(async () => options.onUpdating?.()),
               updateInfo: { version: "2.4.0" },
               progress: 42,
               contentLength: { current: 100 },
               downloaded: { current: 42 },
            }) as any,
      );

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("Updating to")).toBeInTheDocument());
      expect(screen.getByText("2.4.0")).toBeInTheDocument();
   });

   it("goes to an error state when the update check fails", async () => {
      vi.mocked(useUpdater).mockImplementation(
         (options: any) =>
            ({
               checkAndDownload: vi.fn(async () => options.onError?.("update_failed")),
               updateInfo: undefined,
               progress: 0,
               contentLength: { current: 0 },
               downloaded: { current: 0 },
            }) as any,
      );

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("update_failed")).toBeInTheDocument());
      // "Continue" only shows up when the failure happened during check_update
      expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
   });
});

// ============================================================================
// initialize / connect step
// ============================================================================
describe("initialize step", () => {
   it("redirects to the stored session pathname on success and no auth requirement", async () => {
      sessionStorage.setItem("redirect", JSON.stringify({ pathname: "/settings", requiresAuth: false }));
      const connectFn = vi.fn();
      vi.mocked(useConnect).mockReturnValue(connectFn);

      render(<IndexComponent />);

      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/settings", replace: true })));
      expect(connectFn).not.toHaveBeenCalled();
   });

   it("navigates to /channels/@me and shows a welcome message on a fresh successful connect", async () => {
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: true }));
      vi.mocked(useClient).mockReturnValue({ currentUser: { displayName: "Odin", username: "odin" } } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText(/welcome odin!/i)).toBeInTheDocument());
      expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/channels/@me", replace: true }));
   });

   it("shows a retryable error without navigating away", async () => {
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: false, retryable: true, status: "server_unreachable" }));

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByText("server_unreachable")).toBeInTheDocument());
      expect(navigateMock).not.toHaveBeenCalled();
   });

   it("sends the user to /login on a non-retryable failure", async () => {
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: false, retryable: false }));

      render(<IndexComponent />);

      await waitFor(() => expect(navigateMock).toHaveBeenCalledWith(expect.objectContaining({ to: "/login", replace: true })));
   });
});

// ============================================================================
// Error UI: retry button, countdown, auto-retry
// ============================================================================
describe("error UI", () => {
   beforeEach(() => {
      vi.mocked(useStorage).mockReturnValue({
         hostnamePresets: [{ name: "prod", hostnameSource: "external" }],
         activePresetName: "prod",
      } as any);
   });

   it("retries the current step when the Retry button is clicked", async () => {
      vi.mocked(useConnect).mockReturnValue(vi.fn().mockResolvedValue({ success: true }));
      const user = userEvent.setup();
      vi.mocked(setHostnamesFromExternal)
         .mockResolvedValueOnce({ success: false, status: "unreachable" } as any)
         .mockResolvedValueOnce({ success: true } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Retry" }));

      await waitFor(() => expect(setHostnamesFromExternal).toHaveBeenCalledTimes(2));
   });

   it("starts a 10s countdown when an error occurs", async () => {
      const startCountdown = vi.fn();
      vi.mocked(useCountdown).mockReturnValue({ startCountdown, countdown: 0 });
      vi.mocked(setHostnamesFromExternal).mockResolvedValue({ success: false, status: "unreachable" } as any);

      render(<IndexComponent />);

      await waitFor(() => expect(startCountdown).toHaveBeenCalledWith(10));
   });

   it("auto-retries once the countdown hook reports zero", async () => {
      // useCountdown is fully mocked, so it has no timer of its own - "time passing" means
      // changing what the hook returns and forcing React to re-render with the new value.
      let countdown = 10;
      vi.mocked(useCountdown).mockImplementation(() => ({ startCountdown: vi.fn(), countdown }));
      vi.mocked(setHostnamesFromExternal).mockResolvedValue({ success: false, status: "unreachable" } as any);

      const { rerender } = render(<IndexComponent />);
      await waitFor(() => expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument());

      countdown = 0;
      rerender(<IndexComponent />);

      await waitFor(() => expect(setHostnamesFromExternal).toHaveBeenCalledTimes(2));
   });
});

// ============================================================================
// Electron-only behavior
// ============================================================================
describe("desktop shell integration", () => {
   it("asks the main process to show the window when not launched --silent", () => {
      vi.mocked(useHuginnWindow).mockReturnValue({ environment: "desktop", args: [] } as any);

      render(<IndexComponent />);

      expect(window.electronAPI.showMain).toHaveBeenCalled();
   });

   it("stays hidden when launched with --silent", () => {
      vi.mocked(useHuginnWindow).mockReturnValue({ environment: "desktop", args: ["--silent"] } as any);

      render(<IndexComponent />);

      expect(window.electronAPI.showMain).not.toHaveBeenCalled();
   });
});
