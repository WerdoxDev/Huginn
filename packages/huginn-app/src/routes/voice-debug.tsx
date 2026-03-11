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
import { Disclosure, DisclosureButton, DisclosurePanel, Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { useLookup } from "@hooks/useLookup";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";

export const Route = createFileRoute("/voice-debug")({ component: VoiceDebugComponent });

function VoiceDebugComponent() {
   const [data, setData] = useState<VoiceDebugData>();

   const usersLookup = useLookup(data?.usersData, (x) => x.id);
   const producersLookup = useLookup(data?.producersData, (x) => x.id);

   useEffect(() => {
      const channel = new BroadcastChannel("voice-debug");

      channel.onmessage = (d) => {
         setData(d.data);
      };

      return () => {
         channel.close();
      };
   }, []);

   return (
      <div className="h-full overflow-hidden p-1 leading-4 text-white">
         <TabGroup className="flex h-full flex-col gap-y-5">
            <TabList className="flex flex-wrap gap-2">
               <DebugTab>Users</DebugTab>
               <DebugTab>Voice States</DebugTab>
               <DebugTab>ASPs</DebugTab>
               <DebugTab>ALCs</DebugTab>
               <DebugTab>Consumers</DebugTab>
               <DebugTab>Producers</DebugTab>
               <DebugTab>Stats Parsers</DebugTab>
            </TabList>
            <TabPanels className="scroll-alternative2 flex h-full w-full overflow-y-auto">
               {/* Users */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.usersData.map((x, index) => (
                     <UserViewer data={x} index={index} />
                  ))}
               </TabPanel>

               {/* Voice States */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.voiceStatesData.map((x, index) => (
                     <VoiceStateViewer data={x} user={usersLookup[x.userId]} index={index} />
                  ))}
               </TabPanel>

               {/* ASPs */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.aspData.map((x, index) => (
                     <ASPViewer data={x} user={usersLookup[x.userId]} index={index} />
                  ))}
               </TabPanel>

               {/* ALCs */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.alcData.map((x, index) => (
                     <ALCViewer data={x} user={x.userId ? usersLookup[x.userId] : undefined} index={index} />
                  ))}
               </TabPanel>

               {/* Consumers */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.consumersData.map((x, index) => (
                     <ConsumerViewer data={x} usersLookup={usersLookup} producer={producersLookup[x.producerId]} index={index} />
                  ))}
               </TabPanel>

               {/* Producers */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.producersData.map((x, index) => (
                     <ProducerViewer data={x} user={usersLookup[x.userId]} index={index} />
                  ))}
               </TabPanel>

               {/* Stats Parsers */}
               <TabPanel className="flex w-full flex-col gap-y-2">
                  {data?.statsParsersData.map((x, index) => (
                     <StatsParserViewer data={x} index={index} />
                  ))}
               </TabPanel>
            </TabPanels>
         </TabGroup>
      </div>
   );
}

function DebugTab(props: { children?: ReactNode }) {
   return <Tab className="bg-surface data-selected:bg-primary-600 shrink-0 cursor-pointer px-2 py-1 outline-none">{props.children}</Tab>;
}

function UserViewer(props: { data: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col p-1">
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

function VoiceStateViewer(props: { data: VoiceStatesDebugData; user: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col p-1">
         <Section text={`Voice State ${props.index}`}>
            <Field text="User ID" value={`${props.data.userId} (${props.user.username})`} />
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

function StatsParserViewer(props: { data: StatsParserData; index: number }) {
   return (
      <div className="bg-surface flex flex-col p-1">
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
      <div className="bg-surface flex flex-col p-1">
         <Section text={`${props.data.type === "local" ? "Local" : "Remote"} Consumer ${props.index}`}>
            <Field text="ID" value={props.data.id} />
            <Field
               text="Producer ID"
               value={`${props.data.producerId} (${props.producer ? props.usersLookup[props.producer.userId].username : ""})`}
            />
            <Field text="User ID" value={`${props.data.userId} (${props.usersLookup[props.data.userId]?.username})`} />
            <Field text="Kind" value={props.data.kind} />
            <Field text="Media Kind" value={props.data.mediaKind} />
            {props.data.type === "local" && (
               <Field text="Bitrate" value={`${bitrate} Bps | ${(bitrate / 8_000_000).toFixed(3)} MB/s | ${(bitrate / 1_000_000).toFixed(3)} Mbps`} />
            )}

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

function ProducerViewer(props: { data: ProducerDebugData; user: UsersDebugData; index: number }) {
   const totalBitrate = (props.data.stats?.videoOutbound ?? props.data.stats?.audioOutbound)?.reduce((a, b) => a + b.bitrate, 0) ?? 0;
   return (
      <div className="bg-surface flex flex-col p-1">
         <Section text={`${props.data.type === "local" ? "Local" : "Remote"} Producer ${props.index}`}>
            <Field text="ID" value={props.data.id} />
            <Field text="User ID" value={`${props.data.userId} (${props.user.username})`} />
            <Field text="Kind" value={props.data.kind} />
            <Field text="Media Kind" value={props.data.mediaKind} />
            {props.data.type === "local" && (
               <Field
                  text="Bitrate"
                  value={`${totalBitrate} Bps | ${(totalBitrate / 8_000_000).toFixed(3)} MB/s | ${(totalBitrate / 1_000_000).toFixed(3)} Mbps`}
               />
            )}

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
                     <Section text="Audio Inbound" collapsable className="mt-2">
                        {props.data.stats.audioOutbound.map((x, i) => (
                           <Section text={`Audio ${i}`}>
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
                     <Section text="Video Inbound" collapsable className="mt-2">
                        {props.data.stats.videoOutbound.map((x, i) => (
                           <Section text={`Video ${i}`}>
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
      <div className="bg-surface flex flex-col p-1">
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

function ASPViewer(props: { data: ASPData; user: UsersDebugData; index: number }) {
   return (
      <div className="bg-surface flex flex-col p-1">
         <Section text={`Audio Source Player ${props.index}`}>
            <Field text="Producer ID" value={props.data.producerId} />
            <Field text="User ID" value={`${props.data.userId} (${props.user.username})`} />
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
                  <TrackViewer data={track} index={index} />
               ))}
            </Section>
         )}

         {props.data.videoTracks.length > 0 && (
            <Section text="Video Tracks" className="mt-2" containerClassName="gap-y-1">
               {props.data.videoTracks.map((track, index) => (
                  <TrackViewer data={track} index={index} />
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
         <div className="flex items-center gap-x-1">
            <Field text="Enabled" value={props.data.enabled} />
            -
            <Field text="State" value={props.data.readyState} />
            -
            <Field text="Muted" value={props.data.muted} />
         </div>
      </Section>
   );
}

function Field(props: { text: string; value?: string | number | boolean | null; bold?: boolean; priority?: "high" | "medium" | "low" }) {
   return (
      <div className="text-sm">
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
         </span>{" "}
         {props.value === "" ? (
            <span className="italic">empty</span>
         ) : typeof props.value === "boolean" ? (
            props.value.toString()
         ) : props.value === undefined ? (
            <span className="italic">undefined</span>
         ) : props.value === null ? (
            <span className="italic">null</span>
         ) : (
            props.value
         )}
      </div>
   );
}

function Section(props: { text: string; children?: ReactNode; className?: string; containerClassName?: string; collapsable?: boolean }) {
   return (
      <Disclosure defaultOpen={!props.collapsable}>
         <div className={props.className}>
            <DisclosureButton className="font-semibold" disabled={!props.collapsable}>
               {props.text}:
            </DisclosureButton>
            <DisclosurePanel className={clsx("ml-2 flex flex-col", props.containerClassName)}>{props.children}</DisclosurePanel>
         </div>
      </Disclosure>
   );
}
