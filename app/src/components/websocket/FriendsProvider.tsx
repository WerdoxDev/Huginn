import { useClient } from "@contexts/apiContext";
import { APIGetUserRelationshipsResult } from "@shared/api-types";
import { GatewayRelationshipCreateDispatchData } from "@shared/gateway-types";
import { Snowflake } from "@shared/snowflake";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

export default function FriendsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();

   function onRelationshipCreated(d: GatewayRelationshipCreateDispatchData) {
      const friends = queryClient.getQueryData<APIGetUserRelationshipsResult>(["relationships"]);
      if (!friends) return;

      if (friends.some((x) => x.id === d.id)) {
         const changedIndex = friends.findIndex((x) => x.id === d.id && x.type !== d.type);
         if (changedIndex !== -1) {
            const newRelationships = friends.toSpliced(changedIndex, 1, { ...friends[changedIndex], type: d.type });
            queryClient.setQueryData(["relationships"], newRelationships);
         }
         return;
      }

      queryClient.setQueryData(["relationships"], [...friends, d]);
   }

   function onRelationshipDeleted(userId: Snowflake) {
      queryClient.setQueryData(["relationships"], (data: APIGetUserRelationshipsResult) => data?.filter((x) => x.user.id !== userId));
   }

   useEffect(() => {
      client.gateway.on("relationship_create", onRelationshipCreated);
      client.gateway.on("relationship_delete", onRelationshipDeleted);

      return () => {
         client.gateway.off("relationship_create", onRelationshipCreated);
         client.gateway.off("relationship_delete", onRelationshipDeleted);
      };
   }, []);

   return props.children;
}
