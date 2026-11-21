import { useSidebarStore } from "@stores/sidebarStore";
import { fireEvent, render, screen } from "@testing-library/react";
import { useLayoutEffect, type ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@components/GuildsBar", () => ({ default: () => <div>Guilds</div> }));
vi.mock("@components/HomeSidebar", () => ({ default: () => <nav>Home sidebar</nav> }));
vi.mock("@components/UserInfo", () => ({ default: () => null }));
vi.mock("@contexts/InsetContext", () => ({ useInset: () => ({ lastNavBarHeight: 0 }) }));
vi.mock("@hooks/useBackHandler", () => ({ BackHandlerId: { LeftSidebar: 20, RightSidebar: 30 }, useBackHandler: vi.fn() }));
vi.mock("@lib/queries", () => ({ getChannelsOptions: () => ({}), queryClient: {} }));
vi.mock("@stores/storageStore", () => ({ useStorage: () => ({ isChannelSidebarOpen: false }), initStorageStoreEarly: vi.fn() }));
vi.mock("@stores/userStore", () => ({ useThisUser: () => ({ user: undefined }) }));
vi.mock("@tanstack/react-query", () => ({ useSuspenseQuery: () => ({ data: [] }) }));
vi.mock("@tanstack/react-router", () => ({
   createFileRoute: () => (options: unknown) => ({ options }),
   Outlet: () => <main>Channel content</main>,
}));

import { Route } from "./_home";

const HomeLayout = Route.options.component!;

function layoutParts(container: HTMLElement) {
   const root = container.firstElementChild as HTMLElement;
   const backdrop = root.children[0] as HTMLElement;
   const sidebar = root.children[1] as HTMLElement;
   return { root, backdrop, sidebar };
}

function swipeRight(target: HTMLElement) {
   fireEvent.touchStart(target, { touches: [{ clientX: 10, clientY: 100 }] });
   fireEvent.touchMove(target, { touches: [{ clientX: 330, clientY: 100 }] });
}

function expectDismissibleOrClosed(container: HTMLElement) {
   const { backdrop, sidebar } = layoutParts(container);
   const isVisible = sidebar.style.transform !== "translateX(-320px)";
   if (isVisible) {
      expect(backdrop.classList.contains("pointer-events-none")).toBe(false);
      fireEvent.click(backdrop);
   }
   expect(sidebar.style.transform).toBe("translateX(-320px)");
}

function StartupViewport({ children }: { children: ReactNode }) {
   useLayoutEffect(() => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
      window.dispatchEvent(new Event("resize"));
   }, []);
   return children;
}

describe("mobile left sidebar", () => {
   beforeAll(async () => {
      await HomeLayout.preload?.();
   });

   beforeEach(() => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
      Object.defineProperty(window, "opener", { configurable: true, value: null });
      useSidebarStore.setState(useSidebarStore.getInitialState(), true);
   });

   it("uses mobile behavior when the viewport settles before effects subscribe", async () => {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
      const { container } = render(
         <StartupViewport>
            <HomeLayout />
         </StartupViewport>,
      );
      await screen.findByRole("navigation");
      expectDismissibleOrClosed(container);
      const { root } = layoutParts(container);
      swipeRight(root);
      fireEvent.touchEnd(root, { touches: [] });
      expect(useSidebarStore.getState().isLeftOpen).toBe(true);
      expectDismissibleOrClosed(container);
   });

   it("opens after a completed swipe and closes through the backdrop", async () => {
      const { container } = render(<HomeLayout />);
      await screen.findByRole("navigation");
      const { root } = layoutParts(container);
      swipeRight(root);
      fireEvent.touchEnd(root, { touches: [] });
      expect(screen.getByRole("navigation")).toBeTruthy();
      expect(useSidebarStore.getState().isLeftOpen).toBe(true);
      expectDismissibleOrClosed(container);
   });

   it("does not leave a visible sidebar without a close area after a cancelled swipe", async () => {
      const { container } = render(<HomeLayout />);
      await screen.findByRole("navigation");
      const { root } = layoutParts(container);
      swipeRight(root);
      fireEvent.touchCancel(root, { touches: [] });
      expect(useSidebarStore.getState().isDragging).toBe(false);
      expectDismissibleOrClosed(container);
   });

   it("restores an open sidebar after cancelling a closing swipe", async () => {
      useSidebarStore.getState().openLeft();
      const { container } = render(<HomeLayout />);
      await screen.findByRole("navigation");
      const { root, sidebar } = layoutParts(container);
      fireEvent.touchStart(root, { touches: [{ clientX: 300, clientY: 100 }] });
      fireEvent.touchMove(root, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchCancel(root, { touches: [] });
      expect(sidebar.style.transform).toBe("translateX(-0px)");
      expect(useSidebarStore.getState().isDragging).toBe(false);
      expectDismissibleOrClosed(container);
   });

   it("discards an unfinished swipe when switching between mobile and desktop", async () => {
      const { container } = render(<HomeLayout />);
      await screen.findByRole("navigation");
      const { root, sidebar } = layoutParts(container);
      swipeRight(root);
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
      fireEvent.resize(window);
      expect(sidebar.style.transform).toBe("none");
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
      fireEvent.resize(window);
      expect(useSidebarStore.getState().isDragging).toBe(false);
      expectDismissibleOrClosed(container);
   });

   it("keeps desktop behavior in a narrow child window", async () => {
      Object.defineProperty(window, "opener", { configurable: true, value: {} });
      const { container } = render(<HomeLayout />);
      await screen.findByRole("navigation");
      const { root, sidebar } = layoutParts(container);
      expect(sidebar.style.transform).toBe("none");
      swipeRight(root);
      fireEvent.touchEnd(root, { touches: [] });
      expect(useSidebarStore.getState().isLeftOpen).toBe(false);
   });

   it("does not restore an interrupted swipe when the layout mounts again", async () => {
      const first = render(<HomeLayout />);
      await screen.findByRole("navigation");
      swipeRight(layoutParts(first.container).root);
      first.unmount();
      const { container } = render(<HomeLayout />);
      await screen.findByRole("navigation");
      expectDismissibleOrClosed(container);
   });
});
