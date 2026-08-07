import type { VoiceStatus } from "@huginnjs/api";
import { VoiceClient } from "@lib/voice/voice-client";
import { useClient, useClientStore } from "@stores/clientStore";
import { useEffect, useMemo, useState } from "react";

const RTT_UPDATE_INTERVAL = 2000;

const statuses: Record<VoiceStatus, { text: string; color?: string }> = {
   disconnected: { text: "Disconnected", color: "!text-negative-300" },
   idle: { text: "Connecting...", color: "!text-caution-300" },
   connecting: { text: "Connecting...", color: "!text-caution-300" },
   ready: { text: "Connected" },
   signaling: { text: "RTC Signalling...", color: "!text-caution-300" },
};

export function useVoiceStatus() {
   const { voiceStatus } = useClientStore();
   const client = useClient();
   const [rtt, setRtt] = useState(0);

   const latencyColor = useMemo(() => {
      const minPing = 100;
      const maxPing = 2000;

      if (rtt <= minPing) return "hsl(120, 100%, 73%)"; // green
      if (rtt >= maxPing) return "hsl(0, 100%, 73%)"; // red

      const t = (rtt - minPing) / (maxPing - minPing); // 0 to 1

      // Interpolate red and green channels
      const hue = 120 - 120 * t; // 120 (green) → 0 (red)
      return `hsl(${hue}, 100%, 73%)`;
   }, [rtt]);

   useEffect(() => {
      if (!client || voiceStatus !== "ready") {
         setRtt(0);
         return;
      }

      let cancelled = false;
      const updateRtt = async () => {
         const roundTripTime = await VoiceClient.sendMessage("get_current_round_trip_time");
         if (!cancelled && roundTripTime !== undefined) setRtt(Math.round(roundTripTime));
      };

      void updateRtt();
      const interval = window.setInterval(() => void updateRtt(), RTT_UPDATE_INTERVAL);

      return () => {
         cancelled = true;
         window.clearInterval(interval);
      };
   }, [client, voiceStatus]);

   return { rtt, latencyColor, statuses, voiceStatus };
}
