import ContextMenu from "@components/contextmenu/ContextMenu";
import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import { ContextMenuProvider, useContextMenu } from "@stores/contextMenuStore";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import HuginnPopover from "./HuginnPopover";

const { action, device } = vi.hoisted(() => ({ action: vi.fn(), device: { isMobile: false } }));

vi.mock("@hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));
vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => device.isMobile }));
vi.mock("@hooks/useStackBackHandler", () => ({ useStackBackHandler: vi.fn() }));
vi.mock("@huginnjs/shared", () => ({
   snowflake: { generateString: () => "popover-test" },
   WorkerID: { APP: 0 },
}));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryErrorResetBoundary: () => ({ reset: vi.fn() }) }));
vi.mock("@contexts/InsetContext", () => ({
   useInset: () => ({ lastNavBarHeight: 0, shouldResizeWindow: false, lastKeyboardHeight: 0, isKeyboardOpen: false }),
}));
// Keep the real store and Base UI overlays; replace application-specific menu contents.
vi.mock("@components/contextmenu/ContextMenusRenderer", () => ({
   default: () => (
      <>
         <TestMenu kind="gif" />
         <TestMenu kind="sticker" />
         <TestMenu kind="message" />
      </>
   ),
}));

type MenuKind = "gif" | "sticker" | "message";

function TestMenu({ kind }: { kind: MenuKind }) {
   const { context, close } = useContextMenu(kind);
   return (
      <ContextMenu<unknown>
         contextMenu={context}
         onClose={close}
         renderChildren={<ContextMenu.Item label="Menu action" onClick={() => action()} />}
      />
   );
}

function Opener({ label, kind }: { label: string; kind: MenuKind }) {
   const { open, context } = useContextMenu(kind);
   return (
      <button type="button" onContextMenu={(event) => open(undefined, event)} data-menu-open={context?.isOpen ?? false}>
         {label}
      </button>
   );
}

function Panel({ kind }: { kind: MenuKind }) {
   // Hooks in the panel component itself must also resolve to the popover's scope.
   const { context } = useContextMenu(kind);
   const [showTarget, setShowTarget] = useState(true);
   return (
      <HuginnPopover.Panel>
         <span>Panel content</span>
         <span data-testid="panel-menu-state">{String(context?.isOpen ?? false)}</span>
         {showTarget && <Opener label="Panel target" kind={kind} />}
         <button type="button" onClick={() => setShowTarget(false)}>
            Remove target
         </button>
      </HuginnPopover.Panel>
   );
}

function Harness({ kind = "gif", keepMounted = false }: { kind?: MenuKind; keepMounted?: boolean }) {
   const [isOpen, setIsOpen] = useState(true);
   return (
      <ContextMenuProvider>
         <Opener label="Global target" kind={kind} />
         <button type="button" onClick={() => setIsOpen(true)}>
            Open popover
         </button>
         <button type="button" onClick={() => setIsOpen(false)}>
            Close popover
         </button>
         <ContextMenusRenderer />
         <HuginnPopover
            popover={{ isOpen, position: [100, 100] }}
            onClose={() => setIsOpen(false)}
            keepMounted={keepMounted}
            renderChildren={<Panel kind={kind} />}
         />
      </ContextMenuProvider>
   );
}

async function openPanelMenu() {
   const target = await screen.findByRole("button", { name: "Panel target" });
   target.focus();
   fireEvent.contextMenu(target, { clientX: 110, clientY: 110 });
   return screen.findByRole("menuitem", { name: "Menu action" });
}

describe("popover context menus", () => {
   beforeEach(() => {
      device.isMobile = false;
      action.mockReset();
   });

   it.each<MenuKind>(["gif", "sticker", "message"])("keeps the popover open after selecting a %s menu action", async (kind) => {
      const user = userEvent.setup();
      render(<Harness kind={kind} />);

      await user.click(await openPanelMenu());

      await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
      expect(screen.getByText("Panel content")).toBeTruthy();
      expect(screen.getByTestId("panel-menu-state").textContent).toBe("false");
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "Panel target" }));
      expect(screen.getByRole("button", { name: "Global target" }).getAttribute("data-menu-open")).toBe("false");
   });

   it("waits for an asynchronous action without dismissing the popover", async () => {
      const user = userEvent.setup();
      let finish!: () => void;
      action.mockImplementationOnce(
         () =>
            new Promise<void>((resolve) => {
               finish = resolve;
            }),
      );
      render(<Harness />);

      await user.click(await openPanelMenu());
      expect(screen.getByText("Panel content")).toBeTruthy();
      expect(screen.getByRole("menuitem").getAttribute("aria-disabled")).toBe("true");

      finish();
      await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
      expect(screen.getByText("Panel content")).toBeTruthy();
   });

   it("keeps focus in the popover when an action removes the originating item", async () => {
      const user = userEvent.setup();
      action.mockImplementationOnce(() => fireEvent.click(screen.getByRole("button", { name: "Remove target" })));
      render(<Harness />);

      await user.click(await openPanelMenu());

      await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
      expect(screen.queryByRole("button", { name: "Panel target" })).toBeNull();
      expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);
   });

   it("dismisses the menu first with Escape and the popover on a second Escape", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await openPanelMenu();

      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
      expect(screen.getByText("Panel content")).toBeTruthy();

      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByText("Panel content")).toBeNull());
   });

   it("still closes the menu and popover on an outside click", async () => {
      const user = userEvent.setup();
      render(<Harness />);
      await openPanelMenu();

      await user.click(document.body);

      await waitFor(() => expect(screen.queryByText("Panel content")).toBeNull());
      expect(screen.queryByRole("menuitem")).toBeNull();
   });

   it("clears menus when a keep-mounted popover closes", async () => {
      render(<Harness keepMounted />);
      await openPanelMenu();

      fireEvent.click(screen.getByRole("button", { name: "Close popover" }));
      await waitFor(() => expect(screen.queryByRole("menuitem")).toBeNull());
      fireEvent.click(screen.getByRole("button", { name: "Open popover" }));

      expect(await screen.findByRole("button", { name: "Panel target" })).toBeTruthy();
      expect(screen.queryByRole("menuitem")).toBeNull();
      expect(screen.getByTestId("panel-menu-state").textContent).toBe("false");
   });

   it("keeps the parent drawer open after a mobile menu action", async () => {
      device.isMobile = true;
      const user = userEvent.setup();
      render(<Harness />);
      const target = await screen.findByRole("button", { name: "Panel target" });
      target.focus();
      fireEvent.contextMenu(target);

      await user.click(await screen.findByRole("button", { name: "Menu action" }));

      await waitFor(() => expect(screen.queryByRole("button", { name: "Menu action" })).toBeNull());
      expect(screen.getByText("Panel content")).toBeTruthy();
      expect(screen.getByTestId("panel-menu-state").textContent).toBe("false");
   });
});
