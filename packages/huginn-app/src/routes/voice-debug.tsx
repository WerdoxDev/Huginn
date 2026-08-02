import { Tabs, Accordion } from "@base-ui/react";
import { useLookup } from "@hooks/useLookup";
import { getHostId } from "@lib/child-window";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";

import type {
   ALCData,
   ASPData,
   AudioContextData,
   ConsumerDebugData,
   ProducerDebugData,
   StatsParserData,
   StreamData,
   TrackData,
   VoiceStatesDebugData,
   VoiceDebugData,
   UsersDebugData,
} from "@/types";

const debugTabs = [
   { value: "users", label: "Users" },
   { value: "voice-states", label: "Voice States" },
   { value: "asps", label: "ASPs" },
   { value: "alcs", label: "ALCs" },
   { value: "consumers", label: "Consumers" },
   { value: "producers", label: "Producers" },
   { value: "transports", label: "Transports" },
   { value: "stats-parsers", label: "Stats Parsers" },
] as const;

export const Route = createFileRoute("/voice-debug")({ component: VoiceDebugComponent });

function VoiceDebugComponent() {
   const [data, setData] = useState<VoiceDebugData>();
   const [lastUpdatedAt, setLastUpdatedAt] = useState<Date>();

   const usersLookup = useLookup(data?.usersData, (x) => x.id);
   const producersLookup = useLookup(data?.producersData, (x) => x.id);

   useEffect(() => {
      const channel = new BroadcastChannel(`voice-debug:${getHostId()}`);

      channel.onmessage = (d) => {
         setData(d.data);
         setLastUpdatedAt(new Date());
      };

      return () => {
         channel.close();
      };
   }, []);

   const transportEndpoints = [
      ...(data?.producersData ?? []).map((endpoint) => ({ endpoint, endpointType: "Producer" as const })),
      ...(data?.consumersData ?? []).map((endpoint) => ({ endpoint, endpointType: "Consumer" as const })),
   ].filter(({ endpoint }) => endpoint.stats?.transport || endpoint.stats?.connection);
   // .filter((item, index, items) => {
   //    const transportId = item.endpoint.stats?.transport?.id;
   //    return !transportId || items.findIndex((candidate) => candidate.endpoint.stats?.transport?.id === transportId) === index;
   // });

   return (
      <div className="bg-surface-deep h-full overflow-hidden p-3 text-white">
         <Tabs.Root className="flex h-full min-h-0 flex-col gap-y-3" defaultValue="users">
            <header className="flex shrink-0 items-start justify-between gap-3">
               <div>
                  <h1 className="text-lg font-semibold tracking-tight">Voice debugger</h1>
                  <p className="mt-0.5 text-xs text-white/45">Live WebRTC state and media diagnostics</p>
               </div>
               <div className="bg-surface flex items-center gap-2 rounded-full px-2.5 py-1 text-xs text-white/60">
                  <span className={clsx("size-2 rounded-full", data ? "bg-positive-500" : "bg-white/25")} />
                  {data ? `Updated ${lastUpdatedAt?.toLocaleTimeString()}` : "Waiting for data"}
               </div>
            </header>

            <Tabs.List className="bg-surface flex shrink-0 flex-wrap gap-1 rounded-lg p-1">
               {debugTabs.map((tab) => (
                  <DebugTab key={tab.value} value={tab.value} count={getTabCount(tab.value, data, transportEndpoints.length)}>
                     {tab.label}
                  </DebugTab>
               ))}
            </Tabs.List>
            <div className="scroll-alternative2 min-h-0 flex-1 overflow-y-auto pr-1">
               {!data && <EmptyState title="Waiting for voice data" detail="Open or join a voice session to start receiving debug information." />}
               <Tabs.Panel value="users" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.usersData.length === 0 && <EmptyState title="No users" detail="No users are present in the latest voice snapshot." />}
                  {data?.usersData.map((x, index) => (
                     <UserViewer key={x.id} data={x} index={index} />
                  ))}
               </Tabs.Panel>

               <Tabs.Panel value="voice-states" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.voiceStatesData.length === 0 && <EmptyState title="No voice states" detail="No active voice states were reported." />}
                  {data?.voiceStatesData.map((x, index) => (
                     <VoiceStateViewer key={`${x.userId}-${x.sessionId}-${index}`} data={x} user={usersLookup[x.userId]} index={index} />
                  ))}
               </Tabs.Panel>

               <Tabs.Panel value="asps" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.aspData.length === 0 && <EmptyState title="No audio source players" detail="No audio source players are active." />}
                  {data?.aspData.map((x, index) => (
                     <ASPViewer key={x.producerId ?? index} data={x} user={usersLookup[x.userId]} index={index} />
                  ))}
               </Tabs.Panel>

               <Tabs.Panel value="alcs" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.alcData.length === 0 && <EmptyState title="No audio level checkers" detail="No audio level checkers are active." />}
                  {data?.alcData.map((x, index) => (
                     <ALCViewer
                        key={`${x.producerId}-${x.consumerId}-${index}`}
                        data={x}
                        user={x.userId ? usersLookup[x.userId] : undefined}
                        index={index}
                     />
                  ))}
               </Tabs.Panel>

               <Tabs.Panel value="consumers" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.consumersData.length === 0 && <EmptyState title="No consumers" detail="No media consumers are active." />}
                  {data?.consumersData.map((x, index) => (
                     <ConsumerViewer key={x.id} data={x} usersLookup={usersLookup} producer={producersLookup[x.producerId]} index={index} />
                  ))}
               </Tabs.Panel>

               <Tabs.Panel value="producers" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.producersData.length === 0 && <EmptyState title="No producers" detail="No media producers are active." />}
                  {data?.producersData.map((x, index) => (
                     <ProducerViewer key={x.id} data={x} user={usersLookup[x.userId]} index={index} />
                  ))}
               </Tabs.Panel>

               <Tabs.Panel value="transports" className="grid w-full gap-3 xl:grid-cols-2">
                  {transportEndpoints.length === 0 && data ? (
                     <EmptyState
                        title="No transport stats"
                        detail="Transport data will appear once a local media endpoint starts reporting WebRTC stats."
                     />
                  ) : (
                     transportEndpoints.map(({ endpoint, endpointType }, index) => (
                        <TransportViewer
                           key={`${endpointType}-${endpoint.id}`}
                           data={endpoint}
                           endpointType={endpointType}
                           user={usersLookup[endpoint.userId]}
                           index={index}
                        />
                     ))
                  )}
               </Tabs.Panel>

               <Tabs.Panel value="stats-parsers" className="grid w-full gap-3 xl:grid-cols-2">
                  {data && data.statsParsersData.length === 0 && <EmptyState title="No stats parsers" detail="No WebRTC stats parsers are active." />}
                  {data?.statsParsersData.map((x, index) => (
                     <StatsParserViewer key={x.id} data={x} index={index} />
                  ))}
               </Tabs.Panel>
            </div>
         </Tabs.Root>
      </div>
   );
}

function getTabCount(value: (typeof debugTabs)[number]["value"], data: VoiceDebugData | undefined, transportCount: number) {
   if (!data) return 0;

   const counts = {
      users: data.usersData.length,
      "voice-states": data.voiceStatesData.length,
      asps: data.aspData.length,
      alcs: data.alcData.length,
      consumers: data.consumersData.length,
      producers: data.producersData.length,
      transports: transportCount,
      "stats-parsers": data.statsParsersData.length,
   };

   return counts[value];
}

function EmptyState(props: { title: string; detail: string }) {
   return (
      <div className="bg-surface col-span-full flex min-h-40 flex-col items-center justify-center rounded-xl border border-white/5 px-6 text-center">
         <div className="font-medium text-white/80">{props.title}</div>
         <div className="mt-1 max-w-sm text-sm text-white/40">{props.detail}</div>
      </div>
   );
}

function DebugTab(props: { children?: ReactNode; value: string; count: number }) {
   return (
      <Tabs.Tab
         type="button"
         value={props.value}
         className={({ active }) =>
            clsx(
               "flex shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors outline-none",
               active ? "bg-primary-700 text-white shadow-sm" : "text-white/55 hover:bg-white/5 hover:text-white/90",
            )
         }
      >
         {props.children}
         <span className="rounded bg-black/15 px-1.5 py-0.5 text-[10px] leading-none tabular-nums">{props.count}</span>
      </Tabs.Tab>
   );
}

function UserViewer(props: { data: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`User ${props.index}`}>
            <Field text="ID" value={props.data.id} />
            <Field text="Username" value={props.data.username} />
            <Field text="Display Name" value={props.data.displayName} />
            <Field text="Flags" value={props.data.flags} />
            <Field text="Avatar" value={props.data.avatar} />
         </Section>
      </div>
   );
}

function VoiceStateViewer(props: { data: VoiceStatesDebugData; user?: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`Voice State ${props.index}`}>
            <Field text="User ID" value={`${props.data.userId} (${props.user?.username ?? "Unknown user"})`} />
            <Field text="Channel ID" value={props.data.channelId} />
            <Field text="Guild ID" value={props.data.guildId} />
            <Field text="Session ID" value={props.data.sessionId} />
            <Field text="Speaking" value={props.data.speaking} />
            <Section text="Flags" collapsable>
               <Field text="Is Audio Deafened" value={props.data.isAudioDeafened} />
               <Field text="Is Audio Muted" value={props.data.isAudioMuted} />
               <Field text="Is Camera On" value={props.data.isCameraOn} />
               <Field text="Is Audio-Streaming" value={props.data.isAudioStreaming} />
               <Field text="Is Screen-Sharing" value={props.data.isScreenSharing} />
            </Section>
         </Section>
      </div>
   );
}

function TransportViewer(props: {
   data: ProducerDebugData | ConsumerDebugData;
   endpointType: "Producer" | "Consumer";
   user?: UsersDebugData;
   index: number;
}) {
   const connection = props.data.stats?.connection;
   const transport = props.data.stats?.transport;

   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`Transport ${props.index}`}>
            <div className="mb-3 flex flex-wrap items-center gap-2">
               <span className="bg-primary-700/40 rounded-full px-2 py-1 text-xs font-medium text-white/80">{props.endpointType}</span>
               <span className="bg-surface-alt rounded-full px-2 py-1 text-xs text-white/60">{props.data.type}</span>
               {transport?.iceState && <StatusBadge label={`ICE ${transport.iceState}`} active={transport.iceState === "connected"} />}
               {transport?.dtlsState && <StatusBadge label={`DTLS ${transport.dtlsState}`} active={transport.dtlsState === "connected"} />}
            </div>
            <Field text="Transport ID" value={transport?.id} />
            <Field text="Endpoint ID" value={props.data.id} />
            <Field text="User" value={`${props.data.userId} (${props.user?.username ?? "Unknown user"})`} />
            <Field text="RTT" value={formatMilliseconds(connection?.rtt)} />
            <Field text="Available Incoming" value={formatBitrate(connection?.availableIncomingBitrate)} />
            <Field text="Available Outgoing" value={formatBitrate(connection?.availableOutgoingBitrate)} />

            {transport && (
               <Section text="Traffic" className="mt-3">
                  <Field text="Bytes Received" value={formatBytes(transport.bytesReceived)} />
                  <Field text="Bytes Sent" value={formatBytes(transport.bytesSent)} />
                  <Field text="Packets Received" value={transport.packetsReceived} />
                  <Field text="Packets Sent" value={transport.packetsSent} />
               </Section>
            )}

            <div className="mt-3 grid gap-3 md:grid-cols-2">
               <CandidateViewer title="Local candidate" data={connection?.localCandidate} />
               <CandidateViewer title="Remote candidate" data={connection?.remoteCandidate} />
            </div>
         </Section>
      </div>
   );
}

function StatusBadge(props: { label: string; active: boolean }) {
   return (
      <span className={clsx("rounded-full px-2 py-1 text-xs", props.active ? "bg-positive-500/20 text-positive-500" : "bg-white/5 text-white/55")}>
         {props.label}
      </span>
   );
}

function CandidateViewer(props: { title: string; data?: { address?: string; port?: number; protocol?: "tcp" | "udp" } }) {
   return (
      <Section text={props.title} className="bg-surface-alt rounded-lg p-2.5">
         <Field text="Address" value={props.data?.address} />
         <Field text="Port" value={props.data?.port} />
         <Field text="Protocol" value={props.data?.protocol} />
      </Section>
   );
}

function formatBytes(value?: number) {
   if (value === undefined) return undefined;
   if (value < 1_000) return `${value} B`;
   if (value < 1_000_000) return `${(value / 1_000).toFixed(1)} KB`;
   return `${(value / 1_000_000).toFixed(2)} MB`;
}

function formatBitrate(value?: number) {
   return value === undefined ? undefined : `${(value / 1_000_000).toFixed(2)} Mbps`;
}

function formatMilliseconds(value?: number) {
   return value === undefined ? undefined : `${(value * 1_000).toFixed(0)} ms`;
}

function StatsParserViewer(props: { data: StatsParserData; index: number }) {
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`Stats Parser ${props.index}`}>
            <Field text="ID" value={props.data.id} />
            <Field text="Type" value={props.data.type} />
         </Section>
      </div>
   );
}

function ConsumerViewer(props: {
   data: ConsumerDebugData;
   usersLookup: Record<string, UsersDebugData>;
   producer?: ProducerDebugData;
   index: number;
}) {
   const bitrate = (props.data.stats?.videoInbound ?? props.data.stats?.audioInbound)?.bitrate ?? 0;
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`${props.data.type === "local" ? "Local" : "Remote"} Consumer ${props.index}`}>
            <Field text="ID" value={props.data.id} />
            <Field
               text="Producer ID"
               value={`${props.data.producerId} (${props.producer ? (props.usersLookup[props.producer.userId]?.username ?? "Unknown user") : ""})`}
            />
            <Field text="User ID" value={`${props.data.userId} (${props.usersLookup[props.data.userId]?.username})`} />
            <Field text="Kind" value={props.data.kind} />
            <Field text="Media Kind" value={props.data.mediaKind} />
            {props.data.type === "local" && <Field text="Bitrate" value={formatBitrate(bitrate)} />}

            {props.data.track && <TrackViewer data={props.data.track} index={0} />}
            {props.data.stats && (
               <Section text="Stats" className="mt-2" collapsable>
                  {props.data.stats.connection && (
                     <Section text="Connection" collapsable className="mt-2">
                        <Field text="RTT" value={props.data.stats.connection.rtt} />
                        <Field text="Available Outgoing Bitrate" value={props.data.stats.connection.availableOutgoingBitrate} />
                        <Field text="Available Incoming Bitrate" value={props.data.stats.connection.availableIncomingBitrate} />
                        <Section text="Local Candidate" className="mt-2">
                           <Field text="Address" value={props.data.stats.connection.localCandidate?.address} />
                           <Field text="Port" value={props.data.stats.connection.localCandidate?.port} />
                           <Field text="Protocol" value={props.data.stats.connection.localCandidate?.protocol} />
                        </Section>
                        <Section text="Remote Candidate" className="mt-2">
                           <Field text="Address" value={props.data.stats.connection.remoteCandidate?.address} />
                           <Field text="Port" value={props.data.stats.connection.remoteCandidate?.port} />
                           <Field text="Protocol" value={props.data.stats.connection.remoteCandidate?.protocol} />
                        </Section>
                     </Section>
                  )}
                  {props.data.stats.transport && (
                     <Section text="Transport" collapsable className="mt-2">
                        <Field text="Bytes Received" value={props.data.stats.transport.bytesReceived} />
                        <Field text="Bytes Sent" value={props.data.stats.transport.bytesSent} />
                        <Field text="Packets Received" value={props.data.stats.transport.packetsReceived} />
                        <Field text="Packets Sent" value={props.data.stats.transport.packetsSent} />
                        <Field text="Ice State" value={props.data.stats.transport.iceState} />
                        <Field text="DTLS State" value={props.data.stats.transport.dtlsState} />
                     </Section>
                  )}
                  {props.data.stats.codec && (
                     <Section text="Codec" collapsable className="mt-2">
                        <Field text="Channels" value={props.data.stats.codec.channels} />
                        <Field text="Clock Rate" value={props.data.stats.codec.clockRate} />
                        <Field text="Mime Type" value={props.data.stats.codec.mimeType} />
                     </Section>
                  )}
                  {props.data.stats.audioInbound && (
                     <Section text="Audio Inbound" collapsable className="mt-2">
                        <Field text="Bitrate" value={props.data.stats.audioInbound.bitrate} />
                        <Field text="Jitter" value={props.data.stats.audioInbound.jitter} />
                        <Field text="Audio Level" value={props.data.stats.audioInbound.audioLevel} />
                        <Field text="Packets Lost" value={props.data.stats.audioInbound.packetsLost} />
                        <Field text="Concealed Samples" value={props.data.stats.audioInbound.concealedSamples} />
                        <Field text="Silent Concealed Samples" value={props.data.stats.audioInbound.silentConcealedSamples} />
                     </Section>
                  )}
                  {props.data.stats.videoInbound && (
                     <Section text="Video Inbound" collapsable className="mt-2">
                        <Field text="Bitrate" value={props.data.stats.videoInbound.bitrate} />
                        <Field text="Jitter" value={props.data.stats.videoInbound.jitter} />
                        <Field text="Width" value={props.data.stats.videoInbound.width} />
                        <Field text="Height" value={props.data.stats.videoInbound.height} />
                        <Field text="Packets Lost" value={props.data.stats.videoInbound.packetsLost} />
                        <Field text="FPS" value={props.data.stats.videoInbound.fps} />
                        <Field text="Frames Dropped" value={props.data.stats.videoInbound.framesDropped} />
                     </Section>
                  )}
               </Section>
            )}
         </Section>
      </div>
   );
}

function ProducerViewer(props: { data: ProducerDebugData; user?: UsersDebugData; index: number }) {
   const totalBitrate = (props.data.stats?.videoOutbound ?? props.data.stats?.audioOutbound)?.reduce((a, b) => a + b.bitrate, 0) ?? 0;
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`${props.data.type === "local" ? "Local" : "Remote"} Producer ${props.index}`}>
            <Field text="ID" value={props.data.id} />
            <Field text="User ID" value={`${props.data.userId} (${props.user?.username ?? "Unknown user"})`} />
            <Field text="Kind" value={props.data.kind} />
            <Field text="Media Kind" value={props.data.mediaKind} />
            {props.data.type === "local" && <Field text="Bitrate" value={formatBitrate(totalBitrate)} />}

            {props.data.track && <TrackViewer data={props.data.track} index={0} />}

            {props.data.stats && (
               <Section text="Stats" className="mt-2" collapsable>
                  {props.data.stats.connection && (
                     <Section text="Connection" collapsable className="mt-2">
                        <Field text="RTT" value={props.data.stats.connection.rtt} />
                        <Field text="Available Outgoing Bitrate" value={props.data.stats.connection.availableOutgoingBitrate} />
                        <Field text="Available Incoming Bitrate" value={props.data.stats.connection.availableIncomingBitrate} />
                        <Section text="Local Candidate" className="mt-2">
                           <Field text="Address" value={props.data.stats.connection.localCandidate?.address} />
                           <Field text="Port" value={props.data.stats.connection.localCandidate?.port} />
                           <Field text="Protocol" value={props.data.stats.connection.localCandidate?.protocol} />
                        </Section>
                        <Section text="Remote Candidate" className="mt-2">
                           <Field text="Address" value={props.data.stats.connection.remoteCandidate?.address} />
                           <Field text="Port" value={props.data.stats.connection.remoteCandidate?.port} />
                           <Field text="Protocol" value={props.data.stats.connection.remoteCandidate?.protocol} />
                        </Section>
                     </Section>
                  )}
                  {props.data.stats.transport && (
                     <Section text="Transport" collapsable className="mt-2">
                        <Field text="Bytes Received" value={props.data.stats.transport.bytesReceived} />
                        <Field text="Bytes Sent" value={props.data.stats.transport.bytesSent} />
                        <Field text="Packets Received" value={props.data.stats.transport.packetsReceived} />
                        <Field text="Packets Sent" value={props.data.stats.transport.packetsSent} />
                        <Field text="Ice State" value={props.data.stats.transport.iceState} />
                        <Field text="DTLS State" value={props.data.stats.transport.dtlsState} />
                     </Section>
                  )}
                  {props.data.stats.codec && (
                     <Section text="Codec" collapsable className="mt-2">
                        <Field text="Channels" value={props.data.stats.codec.channels} />
                        <Field text="Clock Rate" value={props.data.stats.codec.clockRate} />
                        <Field text="Mime Type" value={props.data.stats.codec.mimeType} />
                     </Section>
                  )}
                  {props.data.stats.audioOutbound && (
                     <Section text="Audio Outbound" collapsable className="mt-2">
                        {props.data.stats.audioOutbound.map((x, i) => (
                           <Section key={x.ssrc} text={`Audio ${i}`}>
                              <Field text="Active" value={x.active} />
                              <Field text="Bitrate" value={x.bitrate} />
                              <Field text="Target Bitrate" value={x.targetBitrate} />
                              <Field text="Audio Level" value={x.audioLevel} />
                              <Field text="Packets Sent" value={x.packetsSent} />
                              <Field text="Total Audio Energy" value={x.totalAudioEnergy} />
                              <Field text="SSRC" value={x.ssrc} />
                              <Field text="RID" value={x.rid} />
                           </Section>
                        ))}
                     </Section>
                  )}
                  {props.data.stats.videoOutbound && (
                     <Section text="Video Outbound" collapsable className="mt-2">
                        {props.data.stats.videoOutbound.map((x, i) => (
                           <Section key={x.ssrc} text={`Video ${i}`}>
                              <Field text="Active" value={x.active} />
                              <Field text="Bitrate" value={x.bitrate} />
                              <Field text="Target Bitrate" value={x.targetBitrate} />
                              <Field text="Width" value={x.width} />
                              <Field text="Height" value={x.height} />
                              <Field text="Packets Sent" value={x.packetsSent} />
                              <Field text="FPS" value={x.fps} />
                              <Field text="Scalability Mode" value={x.scalabilityMode} />
                              <Field text="SSRC" value={x.ssrc} />
                              <Field text="RID" value={x.rid} />
                           </Section>
                        ))}
                     </Section>
                  )}
               </Section>
            )}
         </Section>
      </div>
   );
}

function ALCViewer(props: { data: ALCData; user?: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`Audio Level Checker ${props.index}`}>
            <Field text="Producer ID" value={props.data.producerId} />
            <Field text="Consumer ID" value={props.data.consumerId} />
            <Field text="User ID" value={`${props.data.userId} (${props.user?.username})`} />
            <Field text="Current DB" value={props.data.currentDb} />
            <Field text="Kind" value={props.data.kind} />
            <Field text="Stopped" value={props.data.isStopped} />

            {props.data.context && <ContextViewer data={props.data.context} />}
            {props.data.stream && <StreamViewer data={props.data.stream} />}
         </Section>
      </div>
   );
}

function ASPViewer(props: { data: ASPData; user?: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col rounded-xl border border-white/5 p-3 shadow-sm">
         <Section text={`Audio Source Player ${props.index}`}>
            <Field text="Producer ID" value={props.data.producerId} />
            <Field text="User ID" value={`${props.data.userId} (${props.user?.username ?? "Unknown user"})`} />
            <Field text="Kind" value={props.data.kind} />
            <Field text="Global Gain" value={props.data.globalGain} />
            <Field text="Local Gain" value={props.data.localGain} />
            <Field text="Gain" value={props.data.gain} />

            {props.data.context && <ContextViewer data={props.data.context} />}
            {props.data.stream && <StreamViewer data={props.data.stream} />}
         </Section>
      </div>
   );
}

function ContextViewer(props: { data: AudioContextData }) {
   return (
      <Section text="Context" className="mt-2">
         <Field text="Sink ID" value={props.data.sinkId} />
         <Field text="Base Latency" value={props.data.baseLatency} />
         <Field text="Output Latency" value={props.data.outputLatency} />
         <Field text="State" value={props.data.state} />
      </Section>
   );
}

function StreamViewer(props: { data: StreamData }) {
   return (
      <Section text="Stream" className="mt-2">
         <Field text="Stream ID" value={props.data.id} />

         {props.data.audioTracks.length > 0 && (
            <Section text="Audio Tracks" className="mt-2" containerClassName="gap-y-1">
               {props.data.audioTracks.map((track, index) => (
                  <TrackViewer key={track.id} data={track} index={index} />
               ))}
            </Section>
         )}

         {props.data.videoTracks.length > 0 && (
            <Section text="Video Tracks" className="mt-2" containerClassName="gap-y-1">
               {props.data.videoTracks.map((track, index) => (
                  <TrackViewer key={track.id} data={track} index={index} />
               ))}
            </Section>
         )}
      </Section>
   );
}

function TrackViewer(props: { data: TrackData; index: number }) {
   return (
      <Section className="mt-2" text={`Track ${props.index}`} key={props.data.id}>
         <Field text="ID" value={props.data.id} />
         <Field text="Label" value={props.data.label} />
         <Field text="Enabled" value={props.data.enabled} />
         <Field text="State" value={props.data.readyState} />
         <Field text="Muted" value={props.data.muted} />
      </Section>
   );
}

function Field(props: { text: string; value?: string | number | boolean | null; bold?: boolean; priority?: "high" | "medium" | "low" }) {
   return (
      <div className="grid grid-cols-[minmax(7rem,40%)_1fr] gap-x-3 border-b border-white/5 py-1.5 text-sm last:border-b-0">
         <span
            className={clsx(
               props.priority === "high"
                  ? "text-white"
                  : props.priority === "medium"
                    ? "text-white/60"
                    : props.priority === "low"
                      ? "text-white/40"
                      : "text-white/60",
               props.bold && "font-semibold",
            )}
         >
            {props.text}:
         </span>
         {props.value === "" ? (
            <span className="text-white/35 italic">empty</span>
         ) : typeof props.value === "boolean" ? (
            props.value.toString()
         ) : props.value === undefined ? (
            <span className="text-white/35 italic">undefined</span>
         ) : props.value === null ? (
            <span className="text-white/35 italic">null</span>
         ) : (
            props.value
         )}
      </div>
   );
}

function Section(props: { text: string; children?: ReactNode; className?: string; containerClassName?: string; collapsable?: boolean }) {
   if (props.collapsable) {
      return (
         <Accordion.Root>
            <Accordion.Item className={clsx("overflow-hidden rounded-lg border border-white/5", props.className)}>
               <Accordion.Header>
                  <Accordion.Trigger className="flex w-full cursor-pointer items-center justify-between bg-white/3 px-3 py-2 text-left text-sm font-semibold text-white/80 outline-none hover:bg-white/5">
                     {props.text}
                     <span className="text-xs text-white/35">▾</span>
                  </Accordion.Trigger>
               </Accordion.Header>
               <Accordion.Panel className={clsx("flex flex-col px-3 py-2", props.containerClassName)}>{props.children}</Accordion.Panel>
            </Accordion.Item>
         </Accordion.Root>
      );
   }

   return (
      <section className={props.className}>
         <div className="mb-1 text-xs font-semibold tracking-wide text-white/75 uppercase">{props.text}</div>
         <div className={clsx("flex min-w-0 flex-col", props.containerClassName)}>{props.children}</div>
      </section>
   );
}
