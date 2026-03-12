import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useCallback, useEffect, useState } from "react";

import type { MediaSource } from "@/types";

export function useMediaSources() {
   const client = useClient();
   const { user } = useThisUser();

   const gatherMediaSources = useCallback(() => {
      if (!client || !user) {
         return [];
      }

      const sources: MediaSource[] = [];
      const remoteConsumers = client.voice.transport.getRemoteConsumers();

      for (const consumer of client.voice.transport.getConsumers()) {
         sources.push({
            userId: consumer.appData.userId,
            kind: consumer.appData.mediaKind,
            consumerUserIds: [user.id, ...remoteConsumers.filter((x) => x.producerId === consumer.producerId).map((x) => x.userId)],
            consumerId: consumer.id,
            producerId: consumer.producerId,
            track: consumer.track,
            trackSettings: consumer.track.getSettings(),
            type: "consuming",
         });
      }

      for (const producer of client.voice.transport.getProducers()) {
         sources.push({
            userId: producer.appData.userId,
            kind: producer.appData.mediaKind,
            consumerUserIds: remoteConsumers.filter((x) => x.producerId === producer.id).map((x) => x.userId),
            consumerId: undefined,
            producerId: producer.id,
            track: producer.track,
            trackSettings: producer.track?.getSettings(),
            maxBitrate: producer.rtpSender?.getParameters().encodings?.at(-1)?.maxBitrate,
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
            consumerUserIds: remoteConsumers.filter((x) => x.producerId === remoteProducer.producerId).map((x) => x.userId),
            producerId: remoteProducer.producerId,
            consumerId: undefined,
            type: "consumable",
         });
      }

      return sources;
   }, []);

   const [mediaSources, setMediaSources] = useState<MediaSource[]>(() => gatherMediaSources());

   useEffect(() => {
      const unlisteners: Array<(() => void) | undefined> = [];
      unlisteners.push(client?.voice.transport.listen("producer_created", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("consumer_created", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("producer_closed", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("consumer_closed", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("producer_updated", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("remote_consumer_created", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("remote_producer_created", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("remote_consumer_closed", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("remote_producer_closed", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.transport.listen("reset", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.stream.listen("video_constraints_updated", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.stream.listen("video_bitrate_updated", () => setMediaSources(gatherMediaSources())));
      unlisteners.push(client?.voice.stream.listen("audio_bitrate_updated", () => setMediaSources(gatherMediaSources())));

      return () => {
         for (const unlisten of unlisteners) {
            unlisten?.();
         }
      };
   }, []);

   return mediaSources;
}
