import type { GatewayReadyData, GatewayRelationshipCreateData, Snowflake } from "@huginnjs/shared";

import { EventEmitter, RelationshipType } from "@huginnjs/shared";
import { queryClient } from "@lib/queries";
import { clientStore } from "@stores/clientStore";
import { useReadStates } from "@stores/readStateStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import FriendsProvider from "./FriendsProvider";

type RelationshipEvents = {
   relationship_add: GatewayRelationshipCreateData;
   relationship_remove: Snowflake;
};

function relationship(id: Snowflake, userId: Snowflake, type: RelationshipType): GatewayRelationshipCreateData {
   return { id, type, user: { id: userId }, nickname: "", since: null } as GatewayRelationshipCreateData;
}

function Badge() {
   return <span data-testid="requests">{useReadStates().friendsNotificationsCount}</span>;
}

describe("FriendsProvider", () => {
   let gateway: EventEmitter<RelationshipEvents>;

   beforeEach(() => {
      queryClient.removeQueries({ queryKey: ["relationships"] });
      gateway = new EventEmitter<RelationshipEvents>();
      clientStore.setState({
         client: { gateway } as unknown as ReturnType<typeof clientStore.getState>["client"],
         readyData: { relationships: [relationship("1", "existing", RelationshipType.FRIEND)] } as GatewayReadyData,
      });
   });

   afterEach(() => {
      queryClient.removeQueries({ queryKey: ["relationships"] });
      clientStore.setState({ client: undefined, readyData: undefined });
   });

   it("keeps relationships available without a mounted Friends screen and applies a repeated request once", () => {
      expect(queryClient.getQueryDefaults(["relationships"]).gcTime).toBe(Infinity);
      expect(queryClient.getQueryData(["relationships"])).toBeUndefined();

      render(
         <QueryClientProvider client={queryClient}>
            <FriendsProvider>
               <Badge />
            </FriendsProvider>
         </QueryClientProvider>,
      );

      const incoming = relationship("2", "sender", RelationshipType.PENDING_INCOMING);
      act(() => {
         gateway.emit("relationship_add", incoming);
         gateway.emit("relationship_add", incoming);
      });

      expect(queryClient.getQueryData(["relationships"])).toEqual([
         { id: "1", userId: "existing", type: RelationshipType.FRIEND, nickname: "", since: null },
         { id: "2", userId: "sender", type: RelationshipType.PENDING_INCOMING, nickname: "", since: null },
      ]);
      expect(screen.getByTestId("requests").textContent).toBe("1");
   });

   it("applies a removal when the cache is missing", () => {
      clientStore.setState({
         readyData: { relationships: [relationship("2", "sender", RelationshipType.PENDING_INCOMING)] } as GatewayReadyData,
      });

      render(
         <QueryClientProvider client={queryClient}>
            <FriendsProvider>
               <Badge />
            </FriendsProvider>
         </QueryClientProvider>,
      );

      act(() => gateway.emit("relationship_remove", "sender"));

      expect(queryClient.getQueryData(["relationships"])).toEqual([]);
      expect(screen.getByTestId("requests").textContent).toBe("0");
   });
});
