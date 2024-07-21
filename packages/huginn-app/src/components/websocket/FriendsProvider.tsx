import { useClient } from "@contexts/apiContext";
import { APIGetUserRelationshipsResult } from "@huginn/shared";
import { GatewayRelationshipCreateDispatchData } from "@huginn/shared";
import { Snowflake } from "@huginn/shared";
import { useQueryClient } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

export default function FriendsProvider(props: { children?: ReactNode }) {
   const client = useClient();
   const queryClient = useQueryClient();

   function onRelationshipCreated(d: GatewayRelationshipCreateDispatchData) {
      const friends = queryClient.getQueryData<APIGetUserRelationshipsResult>(["relationships"]);
      if (!friends) return;

      if (friends.some(x => x.id === d.id)) {
         const changedIndex = friends.findIndex(x => x.id === d.id && x.type !== d.type);
         if (changedIndex !== -1) {
            const newRelationships = friends.toSpliced(changedIndex, 1, { ...friends[changedIndex], type: d.type });
            queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], newRelationships);
         }
         return;
      }

      queryClient.setQueryData(["relationships"], [...friends, d]);
   }

   function onRelationshipDeleted(userId: Snowflake) {
      queryClient.setQueryData<APIGetUserRelationshipsResult>(["relationships"], data => data?.filter(x => x.user.id !== userId));
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
