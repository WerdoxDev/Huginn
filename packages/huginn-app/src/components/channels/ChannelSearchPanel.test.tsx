import type { HuginnSelectItem } from "@huginn/frontend-shared";
import type { APIMessage } from "@huginnjs/shared";
import type { ReactNode } from "react";

import { ChannelType, MessageType } from "@huginnjs/shared";
import { useChannelStore } from "@stores/channelStore";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AppDirectChannel, AppMessage } from "@/types";

import ChannelSearchPanel from "./ChannelSearchPanel";

const mocks = vi.hoisted(() => ({ searchMessages: vi.fn(), isMobile: false, handleError: vi.fn() }));
const author = { id: "1", username: "matin", displayName: "Matin", avatar: null, banner: null, bio: null, flags: 0 };
const recipient = { id: "2", username: "alex", displayName: "Alex", avatar: null };

vi.mock("@stores/clientStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/clientStore")>()),
   useClient: () => ({ channels: { searchMessages: mocks.searchMessages } }),
}));
vi.mock("@stores/userStore", async (importOriginal) => ({
   ...(await importOriginal<typeof import("@stores/userStore")>()),
   useThisUser: () => ({ user: author }),
}));
vi.mock("@hooks/api-hooks/userHooks", () => ({ useUsers: () => [recipient] }));
vi.mock("@hooks/useErrorHandler", () => ({ useErrorHandler: () => mocks.handleError }));
vi.mock("@hooks/useIsMobile", () => ({ useIsMobile: () => mocks.isMobile }));
vi.mock("@contexts/MessageProvider", () => ({ MessageProvider: ({ message }: { message: AppMessage }) => <li>{message.content}</li> }));

// Keep the shared select's item/value contract while using native controls in jsdom.
vi.mock("@components/dropdown/HuginnSelect", async () => {
   const { Children, isValidElement } = await import("react");
   type Item = HuginnSelectItem<string | number>;
   function Wrapper({ children }: { children?: ReactNode }) {
      return <>{children}</>;
   }
   function Select(props: { children?: ReactNode; selected?: Item; onChange?: (item: Item) => void }) {
      const options: Item[] = [];
      function collect(children: ReactNode) {
         Children.forEach(children, (child) => {
            if (!isValidElement<{ item?: Item; children?: ReactNode }>(child)) return;
            if (child.props.item) options.push(child.props.item);
            collect(child.props.children);
         });
      }
      collect(props.children);
      const label = Children.toArray(props.children).find((child) => isValidElement(child) && child.type === Wrapper);
      const text = isValidElement<{ children?: ReactNode }>(label) ? label.props.children : "Select";
      return (
         <label>
            {text}
            <select
               value={props.selected?.value ?? ""}
               onChange={(event) => props.onChange?.(options.find((option) => String(option.value) === event.target.value)!)}
            >
               <option value="">Select...</option>
               {options.map((option) => (
                  <option key={option.value} value={option.value}>
                     {option.text}
                  </option>
               ))}
            </select>
         </label>
      );
   }
   return { default: Object.assign(Select, { Label: Wrapper, List: () => null, ItemsWrapper: () => null, Item: () => null }) };
});

function message(id: string, content = `Message ${id}`): APIMessage {
   return {
      id,
      content,
      channelId: "100",
      author,
      type: MessageType.DEFAULT,
      timestamp: "2026-10-21T12:00:00.000Z",
      editedTimestamp: null,
      pinned: false,
      mentions: [],
      attachments: [],
      embeds: [],
      mentionEveryone: false,
      mentionOwner: false,
   };
}

function renderPanel(onClose = vi.fn()) {
   const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
   const channel = { id: "100", type: ChannelType.DM, recipientIds: ["2"], name: "Alex" } as AppDirectChannel;
   return render(
      <QueryClientProvider client={queryClient}>
         <ChannelSearchPanel channel={channel} onClose={onClose} />
      </QueryClientProvider>,
   );
}

function submitSearch() {
   fireEvent.click(screen.getByRole("button", { name: "Search" }));
}
function addFilter() {
   fireEvent.click(screen.getByRole("button", { name: "Add filter" }));
}

beforeEach(() => {
   mocks.searchMessages.mockReset().mockResolvedValue([]);
   mocks.isMobile = false;
   mocks.handleError.mockReset();
   vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
   );
   useChannelStore.getState().clearJumpToMessageRequest();
});

afterEach(() => vi.unstubAllGlobals());

describe("channel message search", () => {
   it("adds supported filters without submitting search or nesting forms", async () => {
      const { container } = renderPanel();
      fireEvent.change(screen.getByPlaceholderText("Search messages..."), { target: { value: "hello" } });
      fireEvent.click(screen.getByRole("button", { name: "Mentions" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Mentions" }), { target: { value: "2" } });
      addFilter();
      fireEvent.click(screen.getByRole("button", { name: "Pinned" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Pinned" }), { target: { value: "false" } });
      addFilter();
      for (const [label, value] of [["Attachment filename", "holiday"]]) {
         fireEvent.click(screen.getByRole("button", { name: label }));
         fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });
         addFilter();
      }
      fireEvent.click(screen.getByRole("button", { name: "Has" }));
      fireEvent.change(screen.getByRole("combobox", { name: "Has" }), { target: { value: "embed" } });
      expect(container.querySelector("form form")).toBeNull();
      addFilter();
      expect(mocks.searchMessages).not.toHaveBeenCalled();
      submitSearch();
      await waitFor(() =>
         expect(mocks.searchMessages).toHaveBeenCalledWith({
            channelId: "100",
            content: "hello",
            sortOrder: "desc",
            limit: 25,
            offset: 0,
            mentions: ["2"],
            pinned: false,
            attachmentFilename: "holiday",
            has: ["embed"],
            types: [MessageType.DEFAULT, MessageType.REPLY],
         }),
      );
      await screen.findByText("No results. Try lowering your expectations? :P");
   });

   it("paginates the submitted search and resets to the first page for new searches", async () => {
      mocks.searchMessages.mockImplementation(async ({ offset }) =>
         offset === 0 ? Array.from({ length: 25 }, (_, index) => message(String(index + 1))) : [message("26")],
      );
      renderPanel();
      submitSearch();
      await screen.findByText("Message 1");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await screen.findByText("Message 26");
      expect(mocks.searchMessages).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 25, limit: 25 }));
      expect(screen.getByRole("button", { name: "Next" }).hasAttribute("disabled")).toBe(true);
      fireEvent.change(screen.getByPlaceholderText("Search messages..."), { target: { value: "new search" } });
      const user = userEvent.setup();
      await user.click(screen.getByRole("button", { name: "Sort results" }));
      await user.click(await screen.findByRole("menuitem", { name: "Oldest first" }));
      submitSearch();
      await waitFor(() =>
         expect(mocks.searchMessages).toHaveBeenLastCalledWith(
            expect.objectContaining({ content: "new search", offset: 0, sortOrder: "asc", limit: 25 }),
         ),
      );
      await screen.findByText("Message 1");
   });

   it("shows loading, errors, retry, and empty results", async () => {
      let reject!: (reason: Error) => void;
      mocks.searchMessages.mockImplementationOnce(
         () =>
            new Promise((_resolve, rejectPromise) => {
               reject = rejectPromise;
            }),
      );
      renderPanel();
      const searchButton = screen.getByRole("button", { name: "Search" });
      submitSearch();
      await waitFor(() => expect(searchButton.hasAttribute("disabled")).toBe(true));
      const error = new Error("Network error");
      await act(async () => reject(error));
      await waitFor(() => expect(mocks.handleError).toHaveBeenCalledExactlyOnceWith(error));
      fireEvent.click(screen.getByRole("button", { name: "Search" }));
      await screen.findByText("No results. Try lowering your expectations? :P");
      expect(mocks.searchMessages).toHaveBeenCalledTimes(2);
   });

   it("requires a filename, prevents duplicate filters, and lets filters be removed or cleared", () => {
      renderPanel();
      fireEvent.click(screen.getByRole("button", { name: "Attachment filename" }));
      expect(screen.getByRole("button", { name: "Add filter" }).hasAttribute("disabled")).toBe(true);
      fireEvent.change(screen.getByLabelText(/^Attachment filename/), { target: { value: "holiday" } });
      addFilter();
      fireEvent.click(screen.getByRole("button", { name: "Attachment filename" }));
      fireEvent.change(screen.getByLabelText(/^Attachment filename/), { target: { value: "holiday" } });
      expect(screen.getByRole("button", { name: "Add filter" }).hasAttribute("disabled")).toBe(true);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      fireEvent.click(within(screen.getByText("Attachment filename: holiday").closest("li")!).getByRole("button"));
      fireEvent.click(screen.getByRole("button", { name: "Has" }));
      addFilter();
      fireEvent.click(within(screen.getByText("Has: Image").closest("li")!).getByRole("button"));
      expect(screen.queryByRole("list")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Pinned" }));
      addFilter();
      expect(within(screen.getByRole("list")).getAllByRole("listitem")).toHaveLength(1);
      fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
      expect(screen.queryByRole("list")).toBeNull();
      expect(mocks.searchMessages).not.toHaveBeenCalled();
   });

   it("refreshes identical searches and jumps to messages, closing the panel on mobile", async () => {
      mocks.isMobile = true;
      mocks.searchMessages.mockResolvedValue([message("42")]);
      const onClose = vi.fn();
      renderPanel(onClose);
      submitSearch();
      await screen.findByText("Message 42");
      submitSearch();
      await waitFor(() => expect(mocks.searchMessages).toHaveBeenCalledTimes(2));
      await screen.findByText("Message 42");
      fireEvent.click(screen.getByRole("button", { name: "Jump" }));
      expect(useChannelStore.getState().jumpToMessageRequest).toMatchObject({ channelId: "100", messageId: "42" });
      expect(onClose).toHaveBeenCalledOnce();
   });
});
