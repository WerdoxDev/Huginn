import type { MediaSource } from "@/types";
import { useClient } from "@stores/clientStore";
import { useCallback, useEffect, useState } from "react";

export function useMediaSources() {
   const client = useClient();

   const gatherMediaSources = useCallback(() => {
      if (!client) {
         return [];
      }

      const sources: MediaSource[] = [];
      console.log(client.voice.transport.getConsumers());

      for (const consumer of client.voice.transport.getConsumers()) {
         sources.push({
            userId: consumer.appData.userId,
            kind: consumer.appData.mediaKind,
            consumerId: consumer.id,
            producerId: consumer.producerId,
            track: consumer.track,
            type: "consuming",
         });
      }

      for (const producer of client.voice.transport.getProducers()) {
         sources.push({
            userId: producer.appData.userId,
            kind: producer.appData.mediaKind,
            consumerId: undefined,
            producerId: producer.id,
            track: producer.track,
            type: "producing",
         });
      }

      for (const remoteProducer of client.voice.transport.getRemoteProducers()) {
         // We may already be consuming this source
         if (sources.some((x) => x.producerId === remoteProducer.producerId)) {
            continue;
         }

         sources.push({
            userId: remoteProducer.userId,
            kind: remoteProducer.kind,
            producerId: remoteProducer.producerId,
            consumerId: undefined,
            type: "consumable",
         });
      }

      return sources;
   }, []);

   const [mediaSources, setMediaSources] = useState<MediaSource[]>(() => gatherMediaSources());

   useEffect(() => {
      const unlisten = client?.voice.transport.listen("producer_created", () => setMediaSources(gatherMediaSources()));
      const unlisten2 = client?.voice.transport.listen("consumer_created", () => setMediaSources(gatherMediaSources()));
      const unlisten3 = client?.voice.signaling.listen("new_producer", () => setMediaSources(gatherMediaSources()));
      const unlisten4 = client?.voice.transport.listen("producer_updated", () => setMediaSources(gatherMediaSources()));
      const unlisten5 = client?.voice.transport.listen("producer_closed", () => setMediaSources(gatherMediaSources()));
      const unlisten6 = client?.voice.transport.listen("consumer_closed", () => setMediaSources(gatherMediaSources()));
      const unlisten7 = client?.voice.signaling.listen("producer_closed", () => setMediaSources(gatherMediaSources()));
      const unlisten8 = client?.voice.transport.listen("reset", () => setMediaSources(gatherMediaSources()));

      return () => {
         unlisten?.();
         unlisten2?.();
         unlisten3?.();
         unlisten4?.();
         unlisten5?.();
         unlisten6?.();
         unlisten7?.();
         unlisten8?.();
      };
   }, []);

   return mediaSources;
}
