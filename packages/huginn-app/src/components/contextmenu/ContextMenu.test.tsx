import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ContextMenu from "./ContextMenu";

vi.mock("@hooks/useErrorHandler", () => ({ useErrorHandler: () => vi.fn() }));
vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => false }));
vi.mock("@hooks/useStackBackHandler", () => ({ useStackBackHandler: vi.fn() }));
vi.mock("@huginnjs/shared", () => ({
   snowflake: { generateString: () => "context-menu-test" },
   WorkerID: { APP: 0 },
}));
vi.mock("@stores/modalsStore", () => ({ useModals: () => ({ updateModals: vi.fn() }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryErrorResetBoundary: () => ({ reset: vi.fn() }) }));

describe("ContextMenu", () => {
   it("closes on an outside press immediately after being opened manually", () => {
      const onClose = vi.fn();

      render(
         <ContextMenu contextMenu={{ isOpen: true, position: [20, 30] }} onClose={onClose} renderChildren={<ContextMenu.Item label="Action" />} />,
      );

      fireEvent.pointerDown(document.body);

      expect(onClose).toHaveBeenCalledOnce();
   });
});
