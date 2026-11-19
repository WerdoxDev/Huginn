import type { QueryClient, QueryKey, QueryState } from "@tanstack/react-query";

type QueryMessage =
   | { type: "updated" | "added"; queryHash: string; queryKey: QueryKey; state: QueryState }
   | { type: "removed"; queryHash: string; queryKey: QueryKey };

export function broadcastQueryClient({ queryClient, broadcastChannel }: { queryClient: QueryClient; broadcastChannel: string }): () => void {
   const channel = new BroadcastChannel(broadcastChannel);
   const cache = queryClient.getQueryCache();
   let applyingMessage = false;

   const publish = (message: QueryMessage) => {
      try {
         channel.postMessage(message);
      } catch (error) {
         console.warn(`Failed to broadcast query ${message.queryHash}`, error);
      }
   };

   const unsubscribe = cache.subscribe((event) => {
      if (applyingMessage) return;
      const { queryHash, queryKey, state } = event.query;

      // A child creates empty queries before restoring persisted data or asking
      // the host to fetch it. Publishing those entries clears loaded host data
      // and suspends consumers such as the channel recipients panel.
      if ((event.type === "added" || (event.type === "updated" && event.action.type === "success")) && state.status === "success") {
         publish({ type: "updated", queryHash, queryKey, state });
      } else if (event.type === "removed" && event.query.getObserversCount() > 0) {
         // Keep explicit removal of active queries in sync, but let each window
         // garbage collect its unused cache entries independently.
         publish({ type: "removed", queryHash, queryKey });
      }
   });

   channel.onmessage = ({ data: message }: MessageEvent<QueryMessage>) => {
      if (!message || !["updated", "added", "removed"].includes(message.type)) return;
      const query = cache.get(message.queryHash);

      applyingMessage = true;
      try {
         if (message.type === "removed") {
            if (query) cache.remove(query);
         } else {
            const { state } = message;
            if (state.status !== "success" || state.data === undefined) return;
            if (query && query.state.dataUpdatedAt > state.dataUpdatedAt) return;

            if (query) {
               // Fetching is local to each window; only share completed data.
               query.setData(state.data, { updatedAt: state.dataUpdatedAt, manual: true });
            } else {
               cache.build(queryClient, { queryKey: message.queryKey, queryHash: message.queryHash }, { ...state, fetchStatus: "idle" });
            }
         }
      } finally {
         applyingMessage = false;
      }
   };

   return () => {
      unsubscribe();
      channel.close();
   };
}
