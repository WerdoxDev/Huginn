import type { GatewayRelationshipCreateData, Snowflake } from "@huginn/shared";

import { RelationshipType } from "@huginn/shared";
import { convertToAppRelationship } from "@lib/utils";
import { useClient, useClientStore } from "@stores/clientStore";
import { useReadStates } from "@stores/readStateStore";
import { useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";
import { type ReactNode, useEffect } from "react";

import type { AppRelationship } from "@/types";

export default function FriendsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();
   const api = useClientStore();
   const { setFriendsNotificationsCount } = useReadStates();

   function onRelationshipCreated(d: GatewayRelationshipCreateData) {
      const friends = queryClient.getQueryData<AppRelationship[]>(["relationships"]);
      if (!friends) return;

      const newFriends = produce(friends, (draft) => {
         const changedIndex = draft.findIndex((x) => x.id === d.id && x.type !== d.type);
         if (changedIndex !== -1) {
            draft[changedIndex].type = d.type;
         } else {
            draft.push(convertToAppRelationship(d));
         }
      });

      queryClient.setQueryData<AppRelationship[]>(["relationships"], newFriends);
      setFriendsNotificationsCount(newFriends?.filter((x) => x.type === RelationshipType.PENDING_INCOMING).length ?? 0);
   }

   function onRelationshipDeleted(userId: Snowflake) {
      const newFriends = queryClient.setQueryData<AppRelationship[]>(["relationships"], (old) => old?.filter((x) => x.userId !== userId));
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
