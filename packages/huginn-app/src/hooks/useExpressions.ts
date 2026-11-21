import {
   CDNRoutes,
   CONSTANTS,
   resolveExpression,
   type APIExpression,
   type APIExpressionReference,
   type ExpressionKind,
   type APIPostExpressionAddJSONBody,
   type GatewayExpressionUpdatedData,
} from "@huginnjs/shared";
import { getExpressionSourceKey } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import type { AppExpression } from "@/types";

function refreshDelay(items: APIExpression[] | undefined) {
   const expirations = items?.flatMap((item) => (item.ex ? [item.ex * 1000] : [])) ?? [];
   return expirations.length ? Math.max(1000, Math.min(...expirations) - Date.now() - 30_000) : false;
}

function collectionKey(userId: string | undefined, kind: ExpressionKind) {
   return ["expressions", userId, kind];
}

function sameExpression(a: APIExpressionReference, b: APIExpressionReference) {
   return a.id === b.id && a.type === b.type;
}

export function useExpressionUpdates() {
   const client = useClient();
   const { user } = useThisUser();
   const cache = useQueryClient();

   useEffect(() => {
      if (!user) return;

      return client?.gateway.listen("expression_update", ({ kind, expression }: GatewayExpressionUpdatedData) => {
         cache.setQueryData<APIExpression[]>(collectionKey(user.id, kind), (current) => {
            // An unloaded collection must still fetch its complete list when first used.
            if (!current) return current;

            const updated = current.filter((item) => !sameExpression(item, expression));
            updated.unshift(expression);
            return updated.sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0) || (b.lastUsedAt ?? "").localeCompare(a.lastUsedAt ?? ""));
         });
      });
   }, [client, cache, user?.id]);
}

export function useExpressions(kind: ExpressionKind, isOpen = false) {
   const client = useClient();
   const { user } = useThisUser();
   const { showError } = useModals();
   const cache = useQueryClient();

   const queryKey = collectionKey(user?.id, kind);
   const query = useQuery({
      queryKey,
      queryFn: () => client![kind].getAll(),
      enabled: !!client && !!user,
      staleTime: (query) => refreshDelay(query.state.data) || 60_000,
      refetchOnWindowFocus: isOpen,
      refetchOnReconnect: isOpen,
      refetchInterval: (query) => (isOpen ? refreshDelay(query.state.data) : false),
   });

   const invalidate = () => cache.invalidateQueries({ queryKey });
   const onError = (error: Error) => showError(error.message);

   useEffect(() => {
      if (isOpen && client && user) void query.refetch();
   }, [isOpen, client, user?.id]);

   const addMutation = useMutation({ mutationFn: (ref: APIPostExpressionAddJSONBody) => client![kind].add(ref), onSuccess: invalidate, onError });
   const removeMutation = useMutation({ mutationFn: (ref: APIExpressionReference) => client![kind].remove(ref), onSuccess: invalidate, onError });
   const uploadMutation = useMutation({
      mutationFn: (file: { data: ArrayBuffer; name: string; contentType?: string }) => client![kind].upload(file),
      onSuccess: invalidate,
      onError,
   });

   const downloadAndUploadMutation = useMutation({
      mutationFn: async (media: Partial<APIExpression>) => {
         const src = media.src || media.url;
         if (!src) throw new Error("This media has no download URL.");

         const cdnBase = new URL(client!.cdn.asset(""));
         const source = new URL(src, cdnBase);
         const isCdnSource = source.origin === cdnBase.origin && source.pathname.startsWith(cdnBase.pathname);
         const url = isCdnSource ? source.href : client!.cdn.asset(CDNRoutes.getExternal(source.href));
         const response = await fetch(url);
         if (!response.ok) throw new Error(`Failed to download media: ${response.status}`);

         const data = await response.arrayBuffer();
         const maxBytes = kind === "gifs" ? CONSTANTS.GIF_MAX_BYTES : CONSTANTS.STICKER_MAX_BYTES;
         if (!data.byteLength) throw new Error("The downloaded media is empty.");
         if (data.byteLength > maxBytes) throw new Error(`Choose a file smaller than ${Math.floor(maxBytes / 1024 / 1024)} MB.`);

         return client![kind].upload(
            {
               data,
               name: media.title || source.pathname.split("/").pop() || (kind === "gifs" ? "gif.gif" : "sticker"),
               contentType: response.headers.get("Content-Type") ?? media.contentType,
            },
            { sourceKey: getExpressionSourceKey(media) },
         );
      },
      onSuccess: invalidate,
      onError,
   });

   function find(media: Partial<AppExpression>) {
      const ref = resolveExpression(media);
      const sourceKey = media.sourceKey ?? getExpressionSourceKey(media);
      return query.data?.find((item) => (ref !== undefined && sameExpression(item, ref)) || (!!sourceKey && item.sourceKey === sourceKey));
   }

   async function toggle(media: Partial<AppExpression>) {
      const saved = find(media);
      if (saved) return removeMutation.mutateAsync(saved);

      const reference = resolveExpression(media);
      if (reference) return addMutation.mutateAsync(reference);
      return downloadAndUploadMutation.mutateAsync(media);
   }

   return {
      ...query,
      items: query.data ?? [],
      find,
      toggle,
      upload: uploadMutation.mutateAsync,
      isPending: addMutation.isPending || removeMutation.isPending || uploadMutation.isPending || downloadAndUploadMutation.isPending,
   };
}
