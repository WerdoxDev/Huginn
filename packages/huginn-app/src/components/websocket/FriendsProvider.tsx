import type { GatewayRelationshipCreateData, Snowflake } from "@huginnjs/shared";

import { RelationshipType } from "@huginnjs/shared";
import { getInitialRelationships, persister } from "@lib/queries";
import { convertToAppRelationship } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { useReadStates } from "@stores/readStateStore";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { type ReactNode, useEffect } from "react";

import type { AppRelationship } from "@/types";

export default function FriendsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const { setFriendsNotificationsCount } = useReadStates();

   function onRelationshipCreated(d: GatewayRelationshipCreateData) {
      const relationship = convertToAppRelationship(d);
      const newFriends = queryClient.setQueryData<AppRelationship[]>(["relationships"], (friends) =>
         produce(friends ?? getInitialRelationships() ?? [], (draft) => {
            const changedIndex = draft.findIndex((x) => x.id === d.id);
            if (changedIndex !== -1) {
               draft[changedIndex] = relationship;
            } else {
               draft.push(relationship);
            }
         }),
      );

      persister.persistQueryByKey(["relationships"], queryClient);
      setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
   }

   function onRelationshipDeleted(userId: Snowflake) {
      const newFriends = queryClient.setQueryData<AppRelationship[]>(["relationships"], (old) =>
         (old ?? getInitialRelationships() ?? []).filter((x) => x.userId !== userId),
      );
      persister.persistQueryByKey(["relationships"], queryClient);
      setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
   }

   useEffect(() => {
      const unlisteners: Array<(() => void) | undefined> = [];

      unlisteners.push(client?.gateway.listen("relationship_add", onRelationshipCreated));
      unlisteners.push(client?.gateway.listen("relationship_remove", onRelationshipDeleted));

      return () => {
         for (const unlisten of unlisteners) {
            unlisten?.();
         }
      };
   }, []);

   return props.children;
}
