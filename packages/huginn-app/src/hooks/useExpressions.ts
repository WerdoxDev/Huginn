import {
   CDNRoutes,
   CONSTANTS,
   resolveExpression,
   type APIExpression,
   type APIExpressionReference,
   type ExpressionKind,
   type APIPostExpressionAddJSONBody,
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

export function useExpressions(kind: ExpressionKind, isOpen = false) {
   const client = useClient();
   const { user } = useThisUser();
   const { showError } = useModals();
   const cache = useQueryClient();

   const queryKey = ["expressions", user?.id, kind];
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
      return query.data?.find(
         (item) => (ref !== undefined && item.id === ref.id && item.type === ref.type) || (!!sourceKey && item.sourceKey === sourceKey),
      );
   }

   return {
      ...query,
      items: query.data ?? [],
      find,
      add: addMutation.mutateAsync,
      remove: removeMutation.mutateAsync,
      upload: uploadMutation.mutateAsync,
      downloadAndUpload: downloadAndUploadMutation.mutateAsync,
      isPending: addMutation.isPending || removeMutation.isPending || uploadMutation.isPending || downloadAndUploadMutation.isPending,
   };
}
