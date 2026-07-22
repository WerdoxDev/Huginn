import type { ConsumerStats, ProducerStats } from "@/types";

export type Bitrate = {
   bitrate: number; // bits per second
   timestamp: number;
   bytes: number;
};

export class WebRTCStatsParser {
   private lastBytes: Record<string, Bitrate> = {};
   public readonly id: string;
   public readonly type: "producer" | "consumer";

   public constructor(id: string, type: "producer" | "consumer") {
      this.id = id;
      this.type = type;
   }

   public computeBitrate(id: string, bytes: number, timestamp: number): number {
      const prev = this.lastBytes[id];
      this.lastBytes[id] = { bytes, timestamp, bitrate: 0 };

      if (!prev) return 0;

      const timeDiff = timestamp - prev.timestamp;
      const byteDiff = bytes - prev.bytes;
      if (timeDiff <= 0 || byteDiff < 0) return 0;

      const bitsPerSecond = Math.floor((byteDiff * 8 * 1000) / timeDiff);
      return bitsPerSecond;
   }

   public parseConsumer(report: RTCStatsReport) {
      const stats: ConsumerStats = {};

      const byId: Record<string, any> = {};
      report.forEach((s) => (byId[s.id] = s));

      for (const stat of report.values()) {
         const { timestamp, type, id } = stat;

         if (type === "candidate-pair") {
            const data = stat as RTCIceCandidatePairStats;
            const localCandidate = byId[data.localCandidateId] as RTCIceCandidateStats;
            const remoteCandidate = byId[data.remoteCandidateId] as RTCIceCandidateStats;
            stats.connection = {
               rtt: data.currentRoundTripTime,
               availableIncomingBitrate: data.availableIncomingBitrate,
               availableOutgoingBitrate: data.availableOutgoingBitrate,
               localCandidate: {
                  address: localCandidate.address,
                  port: localCandidate.port,
                  protocol: localCandidate.protocol,
               },
               remoteCandidate: {
                  address: remoteCandidate.address,
                  port: remoteCandidate.port,
                  protocol: remoteCandidate.protocol,
               },
            };
         } else if (type === "transport") {
            const data = stat as RTCTransportStats;
            stats.transport = {
               id: data.id,
               bytesReceived: data.bytesReceived,
               bytesSent: data.bytesSent,
               packetsReceived: data.packetsReceived,
               packetsSent: data.packetsSent,
               dtlsState: data.dtlsState,
               iceState: data.iceState,
            };
         } else if (type === "codec") {
            const data = stat as RTCCodecStats;
            stats.codec = {
               clockRate: data.clockRate,
               mimeType: data.mimeType,
               channels: data.channels,
            };
         } else if (type === "inbound-rtp") {
            const data = stat as RTCInboundRtpStreamStats;
            if (data.kind === "audio") {
               stats.audioInbound = {
                  bitrate: this.computeBitrate(id, data.bytesReceived ?? 0, timestamp),
                  audioLevel: data.audioLevel,
                  packetsLost: data.packetsLost,
                  jitter: data.jitter,
                  concealedSamples: data.concealedSamples,
                  silentConcealedSamples: data.silentConcealedSamples,
               };
            } else if (data.kind === "video") {
               stats.videoInbound = {
                  bitrate: this.computeBitrate(id, data.bytesReceived ?? 0, timestamp),
                  fps: data.framesPerSecond,
                  jitter: data.jitter,
                  width: data.frameWidth,
                  height: data.frameHeight,
                  framesDropped: data.framesDropped,
                  packetsLost: data.packetsLost,
               };
            }
         }
      }

      return stats;
   }

   public parseProducer(report: RTCStatsReport) {
      const stats: ProducerStats = {};

      const byId: Record<string, any> = {};
      report.forEach((s) => (byId[s.id] = s));

      for (const stat of report.values()) {
         const { timestamp, type, id } = stat;

         if (type === "candidate-pair") {
            const data = stat as RTCIceCandidatePairStats;
            const localCandidate = byId[data.localCandidateId] as RTCIceCandidateStats;
            const remoteCandidate = byId[data.remoteCandidateId] as RTCIceCandidateStats;
            stats.connection = {
               rtt: data.currentRoundTripTime,
               availableIncomingBitrate: data.availableIncomingBitrate,
               availableOutgoingBitrate: data.availableOutgoingBitrate,
               localCandidate: {
                  address: localCandidate.address,
                  port: localCandidate.port,
                  protocol: localCandidate.protocol,
               },
               remoteCandidate: {
                  address: remoteCandidate.address,
                  port: remoteCandidate.port,
                  protocol: remoteCandidate.protocol,
               },
            };
         } else if (type === "transport") {
            const data = stat as RTCTransportStats;
            stats.transport = {
               id: data.id,
               bytesReceived: data.bytesReceived,
               bytesSent: data.bytesSent,
               packetsReceived: data.packetsReceived,
               packetsSent: data.packetsSent,
               dtlsState: data.dtlsState,
               iceState: data.iceState,
            };
         } else if (type === "codec") {
            const data = stat as RTCCodecStats;
            stats.codec = {
               clockRate: data.clockRate,
               mimeType: data.mimeType,
               channels: data.channels,
            };
         } else if (type === "outbound-rtp") {
            const data = stat as RTCOutboundRtpStreamStats;

            if (data.kind === "audio") {
               const track: RTCAudioSourceStats = data.mediaSourceId ? byId[data.mediaSourceId] : undefined;

               if (!stats.audioOutbound) stats.audioOutbound = [];

               stats.audioOutbound.push({
                  active: data.active,
                  bitrate: this.computeBitrate(id, data.bytesSent ?? 0, timestamp),
                  targetBitrate: data.targetBitrate,
                  packetsSent: data.packetsSent,
                  audioLevel: track.audioLevel,
                  totalAudioEnergy: track.totalAudioEnergy,
                  rid: data.rid,
                  ssrc: data.ssrc,
               });
            } else if (data.kind === "video") {
               if (!stats.videoOutbound) stats.videoOutbound = [];

               stats.videoOutbound.push({
                  active: data.active,
                  bitrate: this.computeBitrate(id, data.bytesSent ?? 0, timestamp),
                  targetBitrate: data.targetBitrate,
                  fps: data.framesPerSecond,
                  width: data.frameWidth,
                  height: data.frameHeight,
                  scalabilityMode: data.scalabilityMode,
                  packetsSent: data.packetsSent,
                  rid: data.rid,
                  ssrc: data.ssrc,
               });
            }
         }
      }

      return stats;
   }
}
