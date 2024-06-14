import { useClient } from "@contexts/apiContext";
import { APIGetUserRelationshipsResult, APIRelationship } from "@shared/api-types";
import { GatewayDispatchEvents } from "@shared/gateway-types";
import { Snowflake } from "@shared/snowflake";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

export default function FriendsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();

   function onRelationshipCreated(relationship: APIRelationship) {
      const friends = queryClient.getQueryData<APIGetUserRelationshipsResult>(["relationships"]);
      if (!friends) return;

      if (friends.some((x) => x.id === relationship.id)) {
         const changedIndex = friends.findIndex((x) => x.id === relationship.id && x.type !== relationship.type);
         if (changedIndex !== -1) {
            const newRelationships = friends.toSpliced(changedIndex, 1, { ...friends[changedIndex], type: relationship.type });
            queryClient.setQueryData(["relationships"], newRelationships);
         }
         return;
      }

      queryClient.setQueryData(["relationships"], [...friends, relationship]);
   }

   function onRelationshipDeleted(userId: Snowflake) {
      const friends = queryClient.getQueryData<APIGetUserRelationshipsResult>(["relationships"]);
      if (!friends) return;

      if (!friends.some((x) => x.user.id === userId)) {
         return;
      }

      const index = friends.findIndex((x) => x.user.id === userId);
      const newFriends = friends.slice();
      newFriends.splice(index, 1);

      queryClient.setQueryData(["relationships"], newFriends);
   }

   useEffect(() => {
      client.gateway.on(GatewayDispatchEvents.RELATIONSHIP_CREATE, onRelationshipCreated);
      client.gateway.on(GatewayDispatchEvents.RELATIONSHIP_DELETE, onRelationshipDeleted);

      return () => {
         client.gateway.off(GatewayDispatchEvents.RELATIONSHIP_CREATE, onRelationshipCreated);
         client.gateway.off(GatewayDispatchEvents.RELATIONSHIP_DELETE, onRelationshipDeleted);
      };
   }, []);

   return props.children;
}
