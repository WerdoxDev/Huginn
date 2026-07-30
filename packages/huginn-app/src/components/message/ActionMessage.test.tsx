import { MessageContext } from "@contexts/MessageProvider";
import { useUser, useUsers } from "@hooks/api-hooks/userHooks";
import { MessageType, type APIDefaultMessage, type APIPublicUser, type Snowflake } from "@huginnjs/shared";
import * as matchers from "@testing-library/jest-dom/matchers";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AppUser, ProcessedMessage } from "@/types";

expect.extend(matchers);

import { makeProcessedMessages } from "@/test-utils";

import ActionMessage from "./ActionMessage";

vi.mock("@hooks/api-hooks/userHooks");
vi.mock("@stores/clientStore");
vi.mock("@stores/storageStore");

describe("RTL & LTR text", () => {
   it("should render RTL and LTR mixed text correctly on all action types", async () => {
      const user = { id: "123", displayName: "یوزر" } as AppUser<APIPublicUser>;
      vi.mocked(useUser).mockReturnValue(user);
      vi.mocked(useUsers).mockReturnValue([]);
      render(
         <MessageContext
            value={{
               message: makeProcessedMessages({ isActionType: true, type: MessageType.CHANNEL_NAME_CHANGED, content: "چنل جدید" }),
               ref: { current: null },
            }}
         >
            <ActionMessage />
         </MessageContext>,
      );

      await waitFor(() => expect(screen.getByText("چنل جدید")).toHaveClass("[unicode-bidi:plaintext]"));
   });
});
